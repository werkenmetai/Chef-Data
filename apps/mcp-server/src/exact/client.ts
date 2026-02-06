/**
 * Exact Online API Client
 *
 * Comprehensive client for the Exact Online REST API with:
 * - Automatic token refresh
 * - Rate limiting
 * - Pagination support
 * - Multi-region support
 * - OData query building
 *
 * @see docs/exact-online-api/
 */

import { Env } from '../types';
import { logger } from '../lib/logger';
import { RateLimiter, RateLimitInfo } from './rate-limiter';
import { TokenManager, TokenData, TokenError } from './token-manager';
import { ExactRegion, getRegionConfig, DEFAULT_REGION } from './regions';
import { PaginationHelper, PaginationOptions } from './pagination';
import { ODataQueryBuilder } from './odata-query';

export interface ExactClientConfig {
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret */
  clientSecret: string;
  /** Region code (NL, BE, UK, DE, US, ES, FR) */
  region?: ExactRegion;
  /** Initial division ID (can be set later) */
  divisionId?: number;
  /** Existing tokens to use */
  tokens?: TokenData;
  /** Connection ID in database (for tracking refresh failures) */
  connectionId?: string;
  /** Callback when tokens are refreshed */
  onTokenRefresh?: (tokens: TokenData) => Promise<void>;
  /** Callback when token refresh fails and user needs to re-authenticate */
  onTokenRefreshFailed?: (connectionId: string) => Promise<void>;
  /** Rate limiter configuration */
  rateLimitConfig?: {
    maxRequestsPerMinute?: number;
    maxRetries?: number;
  };
}

export interface RequestOptions {
  /** Additional headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Skip rate limiting */
  skipRateLimit?: boolean;
}

export interface ExactAPIResponse<T> {
  data: T;
  rateLimitInfo: RateLimitInfo;
  rawResponse: Response;
}

export class ExactClient {
  private env: Env;
  private tokenManager: TokenManager;
  private rateLimiter: RateLimiter;
  private region: ExactRegion;
  private divisionId: number | null;
  private baseUrl: string;
  private connectionId: string | null;
  private onTokenRefreshFailed?: (connectionId: string) => Promise<void>;

  constructor(config: ExactClientConfig, env: Env) {
    this.env = env;
    this.region = config.region || DEFAULT_REGION;
    this.divisionId = config.divisionId || null;
    this.baseUrl = getRegionConfig(this.region).apiBaseUrl;
    this.connectionId = config.connectionId || null;
    this.onTokenRefreshFailed = config.onTokenRefreshFailed;

    // Initialize token manager
    this.tokenManager = new TokenManager({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      region: this.region,
      onTokenRefresh: config.onTokenRefresh,
    });

    // Set initial tokens if provided
    if (config.tokens) {
      this.tokenManager.setTokens(config.tokens);
    }

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(config.rateLimitConfig);
  }

  // ===== AUTHENTICATION =====

  /**
   * Build the OAuth authorization URL
   */
  getAuthorizationUrl(redirectUri: string, state: string): string {
    return this.tokenManager.buildAuthUrl(redirectUri, state);
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string, redirectUri: string): Promise<TokenData> {
    return this.tokenManager.exchangeCode(code, redirectUri);
  }

  /**
   * Set tokens directly (e.g., from database)
   */
  setTokens(tokens: TokenData): void {
    this.tokenManager.setTokens(tokens);
  }

  /**
   * Get current token data
   */
  getTokenData(): TokenData | null {
    return this.tokenManager.getTokenData();
  }

  /**
   * Check if we have valid tokens
   */
  isAuthenticated(): boolean {
    return this.tokenManager.hasValidTokens();
  }

  // ===== CONFIGURATION =====

  /**
   * Set the current division
   */
  setDivision(divisionId: number): void {
    this.divisionId = divisionId;
  }

  /**
   * Get the current division
   */
  getDivision(): number | null {
    return this.divisionId;
  }

  /**
   * Set the region
   */
  setRegion(region: ExactRegion): void {
    this.region = region;
    this.baseUrl = getRegionConfig(region).apiBaseUrl;
    this.tokenManager.setRegion(region);
  }

  /**
   * Get the current region
   */
  getRegion(): ExactRegion {
    return this.region;
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): ReturnType<RateLimiter['getStatus']> {
    return this.rateLimiter.getStatus();
  }

  /**
   * Get the environment
   */
  getEnv(): Env {
    return this.env;
  }

  // ===== API METHODS =====

  /**
   * Make a GET request
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string>,
    options?: RequestOptions
  ): Promise<T> {
    const response = await this.request<T>('GET', endpoint, params, undefined, options);
    return response.data;
  }

  /**
   * Make a GET request with full response info
   */
  async getWithInfo<T>(
    endpoint: string,
    params?: Record<string, string>,
    options?: RequestOptions
  ): Promise<ExactAPIResponse<T>> {
    return this.request<T>('GET', endpoint, params, undefined, options);
  }

  /**
   * Make a GET request using OData query builder
   */
  async query<T>(
    endpoint: string,
    query: ODataQueryBuilder,
    options?: RequestOptions
  ): Promise<T> {
    const params = query.toParams();
    return this.get<T>(endpoint, params, options);
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>('POST', endpoint, undefined, body, options);
    return response.data;
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>('PUT', endpoint, undefined, body, options);
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  async delete(endpoint: string, options?: RequestOptions): Promise<void> {
    await this.request<void>('DELETE', endpoint, undefined, undefined, options);
  }

  // ===== PAGINATION =====

  /**
   * Fetch all pages of a paginated endpoint
   */
  async getAll<T>(
    endpoint: string,
    params?: Record<string, string>,
    paginationOptions?: PaginationOptions
  ): Promise<T[]> {
    const initialUrl = this.buildUrl(endpoint, params);

    return PaginationHelper.fetchAll<T>(
      async (url) => {
        const targetUrl = url || initialUrl;
        const response = await this.rawRequest('GET', targetUrl);
        let data: unknown;
        try {
          data = await response.json();
        } catch {
          throw new ExactAPIError('Failed to parse JSON response', response.status, '');
        }
        return { data, rawResponse: response };
      },
      initialUrl,
      paginationOptions
    );
  }

  /**
   * Create an async iterator for paginated results
   */
  async *iterate<T>(
    endpoint: string,
    params?: Record<string, string>,
    paginationOptions?: PaginationOptions
  ): AsyncGenerator<T[], void, unknown> {
    const initialUrl = this.buildUrl(endpoint, params);

    yield* PaginationHelper.iterate<T>(
      async (url) => {
        const targetUrl = url || initialUrl;
        const response = await this.rawRequest('GET', targetUrl);
        let data: unknown;
        try {
          data = await response.json();
        } catch {
          throw new ExactAPIError('Failed to parse JSON response', response.status, '');
        }
        return { data, rawResponse: response };
      },
      initialUrl,
      paginationOptions
    );
  }

  // ===== CONVENIENCE METHODS =====

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<CurrentUser> {
    const result = await this.get<CurrentUser[]>('current/Me');
    if (!result || result.length === 0) {
      throw new ExactAPIError('Failed to get current user', 0, '');
    }
    return result[0];
  }

  /**
   * Get all divisions for the current user
   */
  async getDivisions(): Promise<Division[]> {
    return this.get<Division[]>('system/Divisions', {
      $select: 'Code,Description,HID,Customer',
      $orderby: 'Description',
    });
  }

  /**
   * Get a single entity by ID
   */
  async getById<T>(
    endpoint: string,
    id: string,
    select?: string[]
  ): Promise<T | null> {
    const params: Record<string, string> = {
      $filter: `ID eq guid'${id}'`,
    };
    if (select && select.length > 0) {
      params['$select'] = select.join(',');
    }

    const results = await this.get<T[]>(endpoint, params);
    return results.length > 0 ? results[0] : null;
  }

  // ===== INTERNAL METHODS =====

  private async request<T>(
    method: string,
    endpoint: string,
    params?: Record<string, string>,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ExactAPIResponse<T>> {
    const url = this.buildUrl(endpoint, params);

    return this.rateLimiter.executeWithRetry<ExactAPIResponse<T>>(
      async () => this.rawRequest(method, url, body, options),
      async (response) => {
        const rateLimitInfo = this.rateLimiter.parseRateLimitHeaders(response.headers);
        const data = await this.handleResponse<T>(response);

        return {
          data,
          rateLimitInfo,
          rawResponse: response,
        };
      }
    );
  }

  private async rawRequest(
    method: string,
    url: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<Response> {
    let accessToken: string;

    try {
      accessToken = await this.tokenManager.getAccessToken();
    } catch (error) {
      // If token refresh failed and requires re-authentication, notify callback
      if (error instanceof TokenError && error.requiresReauth) {
        logger.error('Token refresh failed, user needs to re-authenticate', error, { connectionId: this.connectionId || undefined });

        // Call the failure callback to update connection status
        if (this.connectionId && this.onTokenRefreshFailed) {
          try {
            await this.onTokenRefreshFailed(this.connectionId);
          } catch (callbackError) {
            logger.error('onTokenRefreshFailed callback error', callbackError instanceof Error ? callbackError : undefined, { connectionId: this.connectionId });
          }
        }
      }
      throw error;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...options?.headers,
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      // Prefer header ensures full entity data is returned after POST/PUT
      // @see docs/knowledge/exact/LESSONS-LEARNED.md - Prefer header lesson
      headers['Prefer'] = 'return=representation';
    }

    // Create AbortController with 30 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchOptions);
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ExactAPIError('Request timeout after 30 seconds', 0, '');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    // If endpoint is a full URL (e.g., __next pagination URL), use it directly
    if (endpoint.startsWith('http')) {
      return endpoint;
    }

    // Handle endpoints that don't need division (like current/Me)
    let url: URL;
    if (endpoint.startsWith('current/') || endpoint.startsWith('system/')) {
      url = new URL(`${this.baseUrl}/${endpoint}`);
    } else {
      if (!this.divisionId) {
        throw new ExactAPIError('Division ID not set. Call setDivision() first.', 0, '');
      }
      url = new URL(`${this.baseUrl}/${this.divisionId}/${endpoint}`);
    }

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorBody = await response.text();
      throw new ExactAPIError(
        `Exact API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    let data: ODataResponse<T>;
    try {
      data = (await response.json()) as ODataResponse<T>;
    } catch {
      throw new ExactAPIError('Failed to parse JSON response', response.status, '');
    }

    // Unwrap OData format
    if (data.d) {
      if (data.d.results !== undefined) {
        return data.d.results as T;
      }
      return data.d as T;
    }

    return data as T;
  }
}

// ===== TYPES =====

interface ODataResponse<T> {
  d?: {
    results?: T;
    __next?: string;
  } & T;
}

export interface CurrentUser {
  CurrentDivision: number;
  UserID: string;
  UserName: string;
  FullName?: string;
  Email?: string;
  LanguageCode?: string;
}

export interface Division {
  Code: number;
  Description: string;
  HID: number;
  Customer: string;
}

export class ExactAPIError extends Error {
  statusCode: number;
  responseBody: string;

  constructor(message: string, statusCode: number, responseBody: string) {
    super(message);
    this.name = 'ExactAPIError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }

  /**
   * Check if this is a rate limit error
   */
  isRateLimitError(): boolean {
    return this.statusCode === 429;
  }

  /**
   * Check if this is an authentication error
   */
  isAuthError(): boolean {
    return this.statusCode === 401;
  }

  /**
   * Check if this is a not found error
   */
  isNotFound(): boolean {
    return this.statusCode === 404;
  }

  /**
   * Parse the error response body
   */
  parseErrorBody(): { code?: string; message?: string } | null {
    try {
      const parsed = JSON.parse(this.responseBody) as {
        error?: { code?: string; message?: { value?: string } | string };
      };
      if (parsed.error) {
        return {
          code: parsed.error.code,
          message:
            typeof parsed.error.message === 'object'
              ? parsed.error.message?.value
              : parsed.error.message,
        };
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }
}
