/**
 * Pagination Helper for Exact Online API
 *
 * Handles automatic pagination through large result sets.
 * - Standard endpoints: 60 records per page
 * - Bulk endpoints: 1000 records per page
 *
 * @see docs/exact-online-api/odata.md
 */

export interface PaginatedResponse<T> {
  results: T[];
  nextUrl: string | null;
  hasMore: boolean;
}

export interface PaginationOptions {
  /** Maximum records per page (default: 60, max: 60 for standard, 1000 for bulk) */
  pageSize?: number;
  /** Maximum total records to fetch (default: unlimited) */
  maxRecords?: number;
  /** Starting offset (default: 0) */
  offset?: number;
  /** Callback for progress updates */
  onProgress?: (progress: PaginationProgress) => void;
}

export interface PaginationProgress {
  fetchedCount: number;
  pageNumber: number;
  hasMore: boolean;
  currentUrl: string;
}

const STANDARD_PAGE_SIZE = 60;
const BULK_PAGE_SIZE = 1000;

export class PaginationHelper {
  /**
   * Parse a paginated response from Exact Online
   */
  static parseResponse<T>(data: unknown): PaginatedResponse<T> {
    const typedData = data as {
      d?: {
        results?: T[];
        __next?: string;
      } & Record<string, unknown>;
    };

    // Handle OData wrapper format
    if (typedData.d) {
      return {
        results: (typedData.d.results || []) as T[],
        nextUrl: typedData.d.__next || null,
        hasMore: !!typedData.d.__next,
      };
    }

    // Handle direct array response
    if (Array.isArray(data)) {
      return {
        results: data as T[],
        nextUrl: null,
        hasMore: false,
      };
    }

    return {
      results: [],
      nextUrl: null,
      hasMore: false,
    };
  }

  /**
   * Check if an endpoint is a bulk endpoint
   *
   * Bulk endpoints allow up to 1000 records per request:
   * - /bulk/ prefix endpoints
   * - /read/ prefix endpoints (ReceivablesList, PayablesList, etc.)
   *
   * @see docs/knowledge/exact/LESSONS-LEARNED.md - Bulk API lesson
   */
  static isBulkEndpoint(endpoint: string): boolean {
    const lowerEndpoint = endpoint.toLowerCase();
    return lowerEndpoint.includes('/bulk/') || lowerEndpoint.includes('/read/');
  }

  /**
   * Get the appropriate page size for an endpoint
   */
  static getPageSize(endpoint: string, requestedSize?: number): number {
    const maxSize = this.isBulkEndpoint(endpoint) ? BULK_PAGE_SIZE : STANDARD_PAGE_SIZE;

    if (requestedSize) {
      return Math.min(requestedSize, maxSize);
    }

    return maxSize;
  }

  /**
   * Build pagination parameters for an initial request
   */
  static buildParams(
    endpoint: string,
    options: PaginationOptions = {}
  ): Record<string, string> {
    const params: Record<string, string> = {};

    const pageSize = this.getPageSize(endpoint, options.pageSize);
    params['$top'] = String(pageSize);

    if (options.offset && options.offset > 0) {
      params['$skip'] = String(options.offset);
    }

    return params;
  }

  /**
   * Create an async iterator for paginated results
   */
  static async *iterate<T>(
    fetchPage: (url: string | null) => Promise<{ data: unknown; rawResponse?: Response }>,
    initialUrl: string,
    options: PaginationOptions = {}
  ): AsyncGenerator<T[], void, unknown> {
    let currentUrl: string | null = initialUrl;
    let totalFetched = 0;
    let pageNumber = 0;
    const maxRecords = options.maxRecords || Infinity;

    while (currentUrl && totalFetched < maxRecords) {
      const { data } = await fetchPage(currentUrl);
      const page = this.parseResponse<T>(data);

      if (page.results.length === 0) {
        break;
      }

      // Trim results if we're approaching maxRecords
      let results = page.results;
      if (totalFetched + results.length > maxRecords) {
        results = results.slice(0, maxRecords - totalFetched);
      }

      totalFetched += results.length;
      pageNumber++;

      // Report progress
      if (options.onProgress) {
        options.onProgress({
          fetchedCount: totalFetched,
          pageNumber,
          hasMore: page.hasMore && totalFetched < maxRecords,
          currentUrl,
        });
      }

      yield results;

      currentUrl = page.hasMore && totalFetched < maxRecords ? page.nextUrl : null;
    }
  }

  /**
   * Fetch all pages and return combined results
   */
  static async fetchAll<T>(
    fetchPage: (url: string | null) => Promise<{ data: unknown; rawResponse?: Response }>,
    initialUrl: string,
    options: PaginationOptions = {}
  ): Promise<T[]> {
    const allResults: T[] = [];

    for await (const page of this.iterate<T>(fetchPage, initialUrl, options)) {
      allResults.push(...page);
    }

    return allResults;
  }
}

/**
 * Helper class to manage cursor-based pagination state
 */
export class PaginationCursor {
  private nextUrl: string | null = null;
  private totalFetched = 0;
  private pageNumber = 0;
  private _hasMore = true;

  constructor(
    private readonly baseUrl: string,
    private readonly pageSize: number = STANDARD_PAGE_SIZE
  ) {}

  /**
   * Get the URL for the next page
   */
  getNextUrl(): string | null {
    if (!this._hasMore) {
      return null;
    }

    if (this.nextUrl) {
      return this.nextUrl;
    }

    // First page
    if (this.pageNumber === 0) {
      const url = new URL(this.baseUrl);
      url.searchParams.set('$top', String(this.pageSize));
      return url.toString();
    }

    return null;
  }

  /**
   * Update cursor state from a response
   */
  update<T>(response: PaginatedResponse<T>): void {
    this.nextUrl = response.nextUrl;
    this._hasMore = response.hasMore;
    this.totalFetched += response.results.length;
    this.pageNumber++;
  }

  /**
   * Check if there are more pages
   */
  hasMore(): boolean {
    return this._hasMore;
  }

  /**
   * Get current state
   */
  getState(): {
    totalFetched: number;
    pageNumber: number;
    hasMore: boolean;
    nextUrl: string | null;
  } {
    return {
      totalFetched: this.totalFetched,
      pageNumber: this.pageNumber,
      hasMore: this._hasMore,
      nextUrl: this.nextUrl,
    };
  }

  /**
   * Reset the cursor
   */
  reset(): void {
    this.nextUrl = null;
    this.totalFetched = 0;
    this.pageNumber = 0;
    this._hasMore = true;
  }
}
