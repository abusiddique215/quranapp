/**
 * Base API Client
 * Core HTTP client with retry logic, caching, and error handling
 */

import { REQUEST_CONFIG, ERROR_CONFIG } from './config';
import type { ApiError } from '@/types/quran';

export class APIError extends Error {
  constructor(
    public code: number,
    message: string,
    public details?: string,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export interface RequestOptions {
  timeout?: number;
  retryAttempts?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  multiplier: number;
  maxDelay: number;
}

/**
 * Base HTTP client with robust error handling and retry logic
 */
export class BaseAPIClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetryAttempts: number;

  constructor(
    baseUrl: string,
    timeout: number = REQUEST_CONFIG.timeouts.response,
    retryAttempts: number = 3
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultTimeout = timeout;
    this.defaultRetryAttempts = retryAttempts;
  }

  /**
   * Make HTTP GET request with retry logic
   */
  async get<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    
    return this.makeRequest<T>(url, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Make HTTP POST request with retry logic
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * Core request method with comprehensive error handling
   */
  private async makeRequest<T>(
    url: string,
    options: RequestInit & RequestOptions
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retryAttempts = this.defaultRetryAttempts,
      headers = {},
      signal,
      ...fetchOptions
    } = options;

    // Merge headers
    const requestHeaders = {
      ...REQUEST_CONFIG.headers,
      ...headers,
    };

    // Create abort controller for timeout
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, timeout);

    // Combine abort signals
    const combinedSignal = signal 
      ? this.combineAbortSignals([signal, timeoutController.signal])
      : timeoutController.signal;

    const retryConfig: RetryConfig = {
      attempts: retryAttempts,
      delay: REQUEST_CONFIG.backoff.initialDelay,
      multiplier: REQUEST_CONFIG.backoff.multiplier,
      maxDelay: REQUEST_CONFIG.backoff.maxDelay,
    };

    return this.executeWithRetry(
      () => fetch(url, {
        ...fetchOptions,
        headers: requestHeaders,
        signal: combinedSignal,
      }),
      retryConfig,
      url,
      () => clearTimeout(timeoutId)
    );
  }

  /**
   * Execute request with exponential backoff retry logic
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<Response>,
    retryConfig: RetryConfig,
    url: string,
    cleanup: () => void
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = retryConfig.delay;

    for (let attempt = 0; attempt <= retryConfig.attempts; attempt++) {
      try {
        // Wait before retry (but not on first attempt)
        if (attempt > 0) {
          await this.sleep(Math.min(delay, retryConfig.maxDelay));
          delay *= retryConfig.multiplier;
        }

        const response = await requestFn();
        cleanup();

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response);
          const error = new APIError(
            response.status,
            errorData.message || response.statusText,
            errorData.details,
            url
          );

          // Don't retry for certain error codes
          if (this.isNonRetryableError(response.status)) {
            throw error;
          }

          lastError = error;
          continue;
        }

        // Parse successful response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text() as unknown as T;
        }

      } catch (error) {
        cleanup();

        // Handle fetch/network errors
        if (error instanceof APIError) {
          lastError = error;
        } else if (error instanceof DOMException && error.name === 'AbortError') {
          lastError = new APIError(408, 'Request timeout', 'The request timed out', url);
        } else if (error instanceof TypeError) {
          lastError = new APIError(0, 'Network error', 'Failed to fetch - check internet connection', url);
        } else {
          lastError = new APIError(500, 'Unknown error', String(error), url);
        }

        // Don't retry on the last attempt
        if (attempt === retryConfig.attempts) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(lastError)) {
          break;
        }
      }
    }

    // All retries exhausted, throw the last error
    if (lastError) {
      throw lastError;
    }

    throw new APIError(500, 'Unknown error occurred', undefined, url);
  }

  /**
   * Parse error response body
   */
  private async parseErrorResponse(response: Response): Promise<{ message: string; details?: string }> {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        return {
          message: errorData.message || errorData.error || 'API request failed',
          details: errorData.details || JSON.stringify(errorData),
        };
      } else {
        const text = await response.text();
        return {
          message: 'API request failed',
          details: text,
        };
      }
    } catch {
      return {
        message: 'API request failed',
        details: 'Unable to parse error response',
      };
    }
  }

  /**
   * Check if error should be retried
   */
  private isRetryableError(error: APIError): boolean {
    // Network and timeout errors are retryable
    if (error.code === 0 || error.code === 408) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (error.code >= 500 && error.code < 600) {
      return true;
    }

    // Rate limiting (429) is retryable
    if (error.code === 429) {
      return true;
    }

    return false;
  }

  /**
   * Check if error should NOT be retried
   */
  private isNonRetryableError(statusCode: number): boolean {
    // Client errors (4xx) except 429 (rate limiting) should not be retried
    return statusCode >= 400 && statusCode < 500 && statusCode !== 429;
  }

  /**
   * Combine multiple abort signals
   */
  private combineAbortSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    const onAbort = () => controller.abort();

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        return controller.signal;
      }
      signal.addEventListener('abort', onAbort);
    }

    // Cleanup listeners when the combined signal is aborted
    controller.signal.addEventListener('abort', () => {
      for (const signal of signals) {
        signal.removeEventListener('abort', onAbort);
      }
    });

    return controller.signal;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Update base URL (useful for failover)
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }
}