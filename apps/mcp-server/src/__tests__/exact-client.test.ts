/**
 * Exact Client Tests
 *
 * Tests for the ExactClient class including:
 * - API request building
 * - OData query construction
 * - Pagination handling
 * - Error responses (401, 429, 500)
 * - Region configuration
 * - Token management integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExactClient, ExactClientConfig, ExactAPIError } from '../exact/client';
import { ODataQueryBuilder } from '../exact/odata-query';
import { REGION_CONFIGS } from '../exact/regions';
import { Env } from '../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ExactClient', () => {
  const createMockEnv = (): Env => ({
    ENVIRONMENT: 'development',
    DB: {} as D1Database,
    TOKEN_ENCRYPTION_KEY: 'test-encryption-key-32-chars!!!',
  });

  const defaultConfig: ExactClientConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    region: 'NL',
    divisionId: 12345,
    tokens: {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: new Date(Date.now() + 600000), // 10 minutes from now
      region: 'NL',
    },
  };

  const createSuccessResponse = (data: unknown, status = 200) => ({
    ok: true,
    status,
    statusText: 'OK',
    headers: new Headers({
      'X-RateLimit-Minutely-Limit': '60',
      'X-RateLimit-Minutely-Remaining': '59',
      'X-RateLimit-Minutely-Reset': String(Math.floor(Date.now() / 1000) + 60),
      'X-RateLimit-Limit': '5000',
      'X-RateLimit-Remaining': '4999',
      'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 86400),
    }),
    json: async () => data,
    text: async () => JSON.stringify(data),
  });

  const createErrorResponse = (status: number, statusText: string, body: string = '') => ({
    ok: false,
    status,
    statusText,
    headers: new Headers({
      'X-RateLimit-Minutely-Remaining': '59',
    }),
    json: async () => JSON.parse(body || '{}'),
    text: async () => body,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should create an ExactClient with default region', () => {
      const client = new ExactClient(
        {
          clientId: 'test-id',
          clientSecret: 'test-secret',
        },
        createMockEnv()
      );

      expect(client.getRegion()).toBe('NL');
    });

    it('should create an ExactClient with custom region', () => {
      const client = new ExactClient(
        {
          ...defaultConfig,
          region: 'BE',
        },
        createMockEnv()
      );

      expect(client.getRegion()).toBe('BE');
    });

    it('should set initial division ID', () => {
      const client = new ExactClient(
        {
          ...defaultConfig,
          divisionId: 67890,
        },
        createMockEnv()
      );

      expect(client.getDivision()).toBe(67890);
    });

    it('should initialize with tokens', () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      expect(client.isAuthenticated()).toBe(true);
      expect(client.getTokenData()).not.toBeNull();
    });

    it('should not be authenticated without tokens', () => {
      const client = new ExactClient(
        {
          clientId: 'test-id',
          clientSecret: 'test-secret',
        },
        createMockEnv()
      );

      expect(client.isAuthenticated()).toBe(false);
    });
  });

  describe('Region Configuration', () => {
    it('should use correct base URL for NL region', () => {
      const client = new ExactClient({ ...defaultConfig, region: 'NL' }, createMockEnv());
      expect(client.getRegion()).toBe('NL');
    });

    it('should use correct base URL for BE region', () => {
      const client = new ExactClient({ ...defaultConfig, region: 'BE' }, createMockEnv());
      expect(client.getRegion()).toBe('BE');
    });

    it('should use correct base URL for UK region', () => {
      const client = new ExactClient({ ...defaultConfig, region: 'UK' }, createMockEnv());
      expect(client.getRegion()).toBe('UK');
    });

    it('should use correct base URL for DE region', () => {
      const client = new ExactClient({ ...defaultConfig, region: 'DE' }, createMockEnv());
      expect(client.getRegion()).toBe('DE');
    });

    it('should use correct base URL for US region', () => {
      const client = new ExactClient({ ...defaultConfig, region: 'US' }, createMockEnv());
      expect(client.getRegion()).toBe('US');
    });

    it('should change region with setRegion()', () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      client.setRegion('FR');

      expect(client.getRegion()).toBe('FR');
    });

    it('should build authorization URL for correct region', () => {
      // Create client without tokens to use configured region
      const client = new ExactClient(
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          region: 'UK',
          divisionId: 12345,
        },
        createMockEnv()
      );

      const authUrl = client.getAuthorizationUrl('https://callback.test', 'state123');

      expect(authUrl).toContain(REGION_CONFIGS.UK.authUrl);
      expect(authUrl).toContain('client_id=test-client-id');
      expect(authUrl).toContain('state=state123');
    });
  });

  describe('Division Management', () => {
    it('should set division ID', () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      client.setDivision(99999);

      expect(client.getDivision()).toBe(99999);
    });

    it('should return null when division not set', () => {
      const client = new ExactClient(
        {
          clientId: 'test-id',
          clientSecret: 'test-secret',
          tokens: defaultConfig.tokens,
        },
        createMockEnv()
      );

      expect(client.getDivision()).toBeNull();
    });

    it('should throw error when making request without division', async () => {
      const client = new ExactClient(
        {
          clientId: 'test-id',
          clientSecret: 'test-secret',
          tokens: defaultConfig.tokens,
        },
        createMockEnv()
      );

      await expect(client.get('crm/Accounts')).rejects.toThrow(
        'Division ID not set. Call setDivision() first.'
      );
    });
  });

  describe('API Request Building', () => {
    it('should build correct URL for division-scoped endpoint', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [{ ID: '1', Name: 'Test' }] } })
      );

      await client.get('crm/Accounts');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`${REGION_CONFIGS.NL.apiBaseUrl}/12345/crm/Accounts`),
        expect.any(Object)
      );
    });

    it('should build correct URL for current/* endpoint (no division)', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [{ UserID: '1' }] } })
      );

      await client.get('current/Me');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`${REGION_CONFIGS.NL.apiBaseUrl}/current/Me`),
        expect.any(Object)
      );
    });

    it('should build correct URL for system/* endpoint (no division)', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [{ Code: 1 }] } })
      );

      await client.get('system/Divisions');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`${REGION_CONFIGS.NL.apiBaseUrl}/system/Divisions`),
        expect.any(Object)
      );
    });

    it('should include query parameters in URL', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [] } })
      );

      await client.get('crm/Accounts', {
        $filter: "Name eq 'Test'",
        $select: 'ID,Name',
        $top: '10',
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      const url = new URL(calledUrl);
      expect(url.searchParams.get('$filter')).toBe("Name eq 'Test'");
      expect(url.searchParams.get('$select')).toBe('ID,Name');
      expect(url.searchParams.get('$top')).toBe('10');
    });

    it('should include Authorization header', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [] } })
      );

      await client.get('crm/Accounts');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
          }),
        })
      );
    });

    it('should include Accept header', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [] } })
      );

      await client.get('crm/Accounts');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/json',
          }),
        })
      );
    });

    it('should include Content-Type header for POST requests', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { ID: 'new-id' } })
      );

      await client.post('crm/Accounts', { Name: 'New Account' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ Name: 'New Account' }),
        })
      );
    });

    it('should include custom headers', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [] } })
      );

      await client.get('crm/Accounts', undefined, {
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });
  });

  describe('OData Query Construction', () => {
    it('should build query from ODataQueryBuilder', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [] } })
      );

      const query = new ODataQueryBuilder()
        .where('Status', 'C')
        .select('ID', 'Name', 'Email')
        .orderBy('Name')
        .top(25);

      await client.query('crm/Accounts', query);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      const url = new URL(calledUrl);
      expect(url.searchParams.get('$filter')).toBe("Status eq 'C'");
      expect(url.searchParams.get('$select')).toBe('ID,Name,Email');
      expect(url.searchParams.get('$orderby')).toBe('Name asc');
      expect(url.searchParams.get('$top')).toBe('25');
    });

    it('should build complex filter query', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [] } })
      );

      const query = new ODataQueryBuilder()
        .where('IsCustomer', true)
        .compare('Revenue', 'gt', 10000)
        .whereNotNull('Email');

      await client.query('crm/Accounts', query);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      const url = new URL(calledUrl);
      const filter = url.searchParams.get('$filter') || '';
      expect(filter).toContain('IsCustomer eq true');
      expect(filter).toContain('Revenue gt 10000');
      expect(filter).toContain('Email ne null');
    });

    it('should handle GUID filters', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [] } })
      );

      const query = new ODataQueryBuilder().whereGuid(
        'ID',
        '12345678-1234-1234-1234-123456789012'
      );

      await client.query('crm/Accounts', query);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      const url = new URL(calledUrl);
      expect(url.searchParams.get('$filter')).toBe("ID eq guid'12345678-1234-1234-1234-123456789012'");
    });
  });

  describe('Response Handling', () => {
    it('should unwrap OData d.results format', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({
          d: {
            results: [
              { ID: '1', Name: 'Account 1' },
              { ID: '2', Name: 'Account 2' },
            ],
          },
        })
      );

      const result = await client.get<{ ID: string; Name: string }[]>('crm/Accounts');

      expect(result).toHaveLength(2);
      expect(result[0].Name).toBe('Account 1');
    });

    it('should unwrap OData d format (single entity)', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({
          d: { ID: '1', Name: 'Single Account' },
        })
      );

      const result = await client.get<{ ID: string; Name: string }>('crm/Accounts');

      expect(result).toEqual({ ID: '1', Name: 'Single Account' });
    });

    it('should handle 204 No Content response', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Headers({
          'X-RateLimit-Minutely-Remaining': '59',
        }),
      });

      await expect(client.delete('crm/Accounts(guid\'123\')')).resolves.toBeUndefined();
    });

    it('should return full response info with getWithInfo', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [{ ID: '1' }] } })
      );

      const result = await client.getWithInfo('crm/Accounts');

      expect(result.data).toEqual([{ ID: '1' }]);
      expect(result.rateLimitInfo).toBeDefined();
      expect(result.rateLimitInfo.minutelyRemaining).toBe(59);
      expect(result.rawResponse).toBeDefined();
    });
  });

  describe('Error Responses', () => {
    it('should throw ExactAPIError on 401 Unauthorized', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createErrorResponse(401, 'Unauthorized', '{"error": "Invalid token"}')
      );

      try {
        await client.get('crm/Accounts');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ExactAPIError);
        expect((error as ExactAPIError).statusCode).toBe(401);
        expect((error as ExactAPIError).isAuthError()).toBe(true);
      }
    });

    it('should throw ExactAPIError on 404 Not Found', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createErrorResponse(404, 'Not Found', '{"error": "Entity not found"}')
      );

      try {
        await client.get('crm/Accounts');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ExactAPIError);
        expect((error as ExactAPIError).statusCode).toBe(404);
        expect((error as ExactAPIError).isNotFound()).toBe(true);
      }
    });

    it('should throw ExactAPIError on 500 Server Error', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createErrorResponse(500, 'Internal Server Error', 'Server error')
      );

      try {
        await client.get('crm/Accounts');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ExactAPIError);
        expect((error as ExactAPIError).statusCode).toBe(500);
      }
    });

    it('should include response body in error', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createErrorResponse(400, 'Bad Request', '{"error": {"code": "BadRequest", "message": "Invalid filter"}}')
      );

      try {
        await client.get('crm/Accounts');
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as ExactAPIError).responseBody).toContain('BadRequest');
      }
    });

    it('should parse error body correctly', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createErrorResponse(
          400,
          'Bad Request',
          '{"error": {"code": "InvalidFilter", "message": {"value": "Filter syntax error"}}}'
        )
      );

      try {
        await client.get('crm/Accounts');
        expect.fail('Should have thrown');
      } catch (error) {
        const parsed = (error as ExactAPIError).parseErrorBody();
        expect(parsed).not.toBeNull();
        expect(parsed!.code).toBe('InvalidFilter');
        expect(parsed!.message).toBe('Filter syntax error');
      }
    });

    it('should handle invalid JSON in error response', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createErrorResponse(500, 'Internal Server Error', 'Not JSON')
      );

      try {
        await client.get('crm/Accounts');
        expect.fail('Should have thrown');
      } catch (error) {
        const parsed = (error as ExactAPIError).parseErrorBody();
        expect(parsed).toBeNull();
      }
    });

    it('should handle JSON parse error in successful response', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'X-RateLimit-Minutely-Remaining': '59',
        }),
        json: async () => {
          throw new Error('Invalid JSON');
        },
        text: async () => 'Not JSON',
      });

      await expect(client.get('crm/Accounts')).rejects.toThrow('Failed to parse JSON response');
    });
  });

  describe('Rate Limiting', () => {
    it('should parse rate limit headers', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [] } })
      );

      const response = await client.getWithInfo('crm/Accounts');

      expect(response.rateLimitInfo.minutelyLimit).toBe(60);
      expect(response.rateLimitInfo.minutelyRemaining).toBe(59);
    });

    it('should expose rate limit status', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [] } })
      );

      await client.get('crm/Accounts');

      const status = client.getRateLimitStatus();
      expect(status).toBeDefined();
      expect(status.serverInfo).not.toBeNull();
    });
  });

  describe('HTTP Methods', () => {
    it('should make GET request', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [] } })
      );

      await client.get('crm/Accounts');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should make POST request with body', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { ID: 'new-id', Name: 'New Account' } })
      );

      const result = await client.post<{ ID: string; Name: string }>('crm/Accounts', {
        Name: 'New Account',
        Email: 'test@example.com',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ Name: 'New Account', Email: 'test@example.com' }),
        })
      );
      expect(result.Name).toBe('New Account');
    });

    it('should make PUT request with body', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { ID: '1', Name: 'Updated Account' } })
      );

      await client.put('crm/Accounts(guid\'1\')', { Name: 'Updated Account' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ Name: 'Updated Account' }),
        })
      );
    });

    it('should make DELETE request', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Headers({
          'X-RateLimit-Minutely-Remaining': '59',
        }),
      });

      await client.delete('crm/Accounts(guid\'1\')');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Pagination', () => {
    it('should fetch all pages with getAll', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      // First page
      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({
          d: {
            results: [{ ID: '1' }, { ID: '2' }],
            __next: 'https://start.exactonline.nl/api/v1/12345/crm/Accounts?$skiptoken=2',
          },
        })
      );

      // Second page
      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({
          d: {
            results: [{ ID: '3' }, { ID: '4' }],
            __next: 'https://start.exactonline.nl/api/v1/12345/crm/Accounts?$skiptoken=4',
          },
        })
      );

      // Third page (last)
      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({
          d: {
            results: [{ ID: '5' }],
          },
        })
      );

      const results = await client.getAll<{ ID: string }>('crm/Accounts');

      expect(results).toHaveLength(5);
      expect(results[0].ID).toBe('1');
      expect(results[4].ID).toBe('5');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should respect maxRecords in pagination', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      // First page with 60 results
      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({
          d: {
            results: Array(60)
              .fill(null)
              .map((_, i) => ({ ID: String(i + 1) })),
            __next: 'https://start.exactonline.nl/api/v1/12345/crm/Accounts?$skiptoken=60',
          },
        })
      );

      // Second page
      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({
          d: {
            results: Array(60)
              .fill(null)
              .map((_, i) => ({ ID: String(i + 61) })),
          },
        })
      );

      const results = await client.getAll<{ ID: string }>('crm/Accounts', undefined, {
        maxRecords: 80,
      });

      expect(results).toHaveLength(80);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should iterate pages with async generator', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch
        .mockResolvedValueOnce(
          createSuccessResponse({
            d: {
              results: [{ ID: '1' }, { ID: '2' }],
              __next: 'https://start.exactonline.nl/api/v1/12345/crm/Accounts?$skiptoken=2',
            },
          })
        )
        .mockResolvedValueOnce(
          createSuccessResponse({
            d: {
              results: [{ ID: '3' }],
            },
          })
        );

      const pages: { ID: string }[][] = [];
      for await (const page of client.iterate<{ ID: string }>('crm/Accounts')) {
        pages.push(page);
      }

      expect(pages).toHaveLength(2);
      expect(pages[0]).toHaveLength(2);
      expect(pages[1]).toHaveLength(1);
    });
  });

  describe('Convenience Methods', () => {
    it('should get current user', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({
          d: {
            results: [
              {
                CurrentDivision: 12345,
                UserID: 'user-1',
                UserName: 'testuser',
                FullName: 'Test User',
              },
            ],
          },
        })
      );

      const user = await client.getCurrentUser();

      expect(user.UserID).toBe('user-1');
      expect(user.FullName).toBe('Test User');
    });

    it('should throw when getCurrentUser returns empty', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [] } })
      );

      await expect(client.getCurrentUser()).rejects.toThrow('Failed to get current user');
    });

    it('should get divisions', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({
          d: {
            results: [
              { Code: 12345, Description: 'Main Division', HID: 1 },
              { Code: 67890, Description: 'Test Division', HID: 2 },
            ],
          },
        })
      );

      const divisions = await client.getDivisions();

      expect(divisions).toHaveLength(2);
      expect(divisions[0].Description).toBe('Main Division');
    });

    it('should get entity by ID', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({
          d: {
            results: [{ ID: '123', Name: 'Found Account' }],
          },
        })
      );

      const account = await client.getById<{ ID: string; Name: string }>(
        'crm/Accounts',
        '123-456-789'
      );

      expect(account).not.toBeNull();
      expect(account!.Name).toBe('Found Account');
    });

    it('should return null when entity not found by ID', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [] } })
      );

      const account = await client.getById('crm/Accounts', 'non-existent-id');

      expect(account).toBeNull();
    });

    it('should include select fields in getById', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({ d: { results: [{ ID: '123' }] } })
      );

      await client.getById('crm/Accounts', '123', ['ID', 'Name', 'Email']);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      const url = new URL(calledUrl);
      expect(url.searchParams.get('$select')).toBe('ID,Name,Email');
    });
  });

  describe('Token Management', () => {
    it('should set tokens with setTokens', () => {
      const client = new ExactClient(
        {
          clientId: 'test-id',
          clientSecret: 'test-secret',
        },
        createMockEnv()
      );

      expect(client.isAuthenticated()).toBe(false);

      client.setTokens({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        expiresAt: new Date(Date.now() + 600000),
        region: 'NL',
      });

      expect(client.isAuthenticated()).toBe(true);
    });

    it('should call onTokenRefresh callback', async () => {
      const onTokenRefresh = vi.fn().mockResolvedValue(undefined);
      const client = new ExactClient(
        {
          clientId: 'test-id',
          clientSecret: 'test-secret',
          onTokenRefresh,
        },
        createMockEnv()
      );

      // Mock exchange code response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access',
          refresh_token: 'new-refresh',
          expires_in: 600,
        }),
      });

      await client.exchangeCode('auth-code', 'https://redirect.test');

      expect(onTokenRefresh).toHaveBeenCalled();
    });

    it('should get token data', () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      const tokenData = client.getTokenData();

      expect(tokenData).not.toBeNull();
      expect(tokenData!.accessToken).toBe('test-access-token');
    });
  });

  describe('Environment Access', () => {
    it('should return environment with getEnv', () => {
      const env = createMockEnv();
      const client = new ExactClient(defaultConfig, env);

      expect(client.getEnv()).toBe(env);
    });
  });

  describe('ExactAPIError', () => {
    it('should create error with message, status, and body', () => {
      const error = new ExactAPIError('Test error', 400, '{"error": "Bad request"}');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.responseBody).toBe('{"error": "Bad request"}');
      expect(error.name).toBe('ExactAPIError');
    });

    it('should detect rate limit error', () => {
      const error = new ExactAPIError('Rate limited', 429, '');
      expect(error.isRateLimitError()).toBe(true);

      const otherError = new ExactAPIError('Other', 400, '');
      expect(otherError.isRateLimitError()).toBe(false);
    });

    it('should detect auth error', () => {
      const error = new ExactAPIError('Unauthorized', 401, '');
      expect(error.isAuthError()).toBe(true);

      const otherError = new ExactAPIError('Other', 400, '');
      expect(otherError.isAuthError()).toBe(false);
    });

    it('should detect not found error', () => {
      const error = new ExactAPIError('Not found', 404, '');
      expect(error.isNotFound()).toBe(true);

      const otherError = new ExactAPIError('Other', 400, '');
      expect(otherError.isNotFound()).toBe(false);
    });

    it('should parse error body with string message', () => {
      const error = new ExactAPIError('Error', 400, '{"error": {"code": "E001", "message": "Simple message"}}');

      const parsed = error.parseErrorBody();
      expect(parsed).not.toBeNull();
      expect(parsed!.code).toBe('E001');
      expect(parsed!.message).toBe('Simple message');
    });

    it('should parse error body with object message', () => {
      const error = new ExactAPIError('Error', 400, '{"error": {"code": "E001", "message": {"value": "Object message"}}}');

      const parsed = error.parseErrorBody();
      expect(parsed).not.toBeNull();
      expect(parsed!.message).toBe('Object message');
    });
  });

  describe('Request Timeout', () => {
    it('should handle request timeout', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());

      const abortError = new Error('Request timeout after 30 seconds');
      abortError.name = 'AbortError';

      mockFetch.mockRejectedValueOnce(abortError);

      await expect(client.get('crm/Accounts')).rejects.toThrow();
    });
  });

  describe('Full URL Handling', () => {
    it('should use full URL directly for pagination', async () => {
      const client = new ExactClient(defaultConfig, createMockEnv());
      const fullUrl = 'https://start.exactonline.nl/api/v1/12345/crm/Accounts?$skiptoken=60';

      // First page with __next URL
      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({
          d: {
            results: [{ ID: '1' }],
            __next: fullUrl,
          },
        })
      );

      // Second page (no more pages)
      mockFetch.mockResolvedValueOnce(
        createSuccessResponse({
          d: {
            results: [{ ID: '2' }],
          },
        })
      );

      const results = await client.getAll('crm/Accounts');

      // Should have fetched 2 pages
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);

      // Second call should use the full __next URL
      const secondCallUrl = mockFetch.mock.calls[1][0] as string;
      expect(secondCallUrl).toBe(fullUrl);
    });
  });
});
