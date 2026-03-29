interface HttpClientConfigType {
  baseUrl: string;
  timeout?: number;
}

type HttpMethod = 'GET' | 'POST' | 'DELETE';

const httpMethods = {
  get: 'GET',
  post: 'POST',
  delete: 'DELETE',
} as const;

type HttpClientErrorCodeType = 'HTTP_ERROR' | 'TIMEOUT_ERROR' | 'NETWORK_ERROR' | 'PARSE_ERROR';

interface HttpClientErrorType {
  status?: number;
  method?: HttpMethod;
  url?: string;
  code?: HttpClientErrorCodeType;
}

class HttpClientError extends Error {
  status?: number;
  method?: HttpMethod;
  url?: string;
  code?: HttpClientErrorCodeType;

  constructor(message: string, options?: HttpClientErrorType) {
    super(message);
    this.name = 'HttpClientError';
    this.status = options?.status;
    this.method = options?.method;
    this.url = options?.url;
    this.code = options?.code;
  }
}

class HttpClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: HttpClientConfigType) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout ?? 5000;
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    headers?: HeadersInit,
    body?: unknown,
  ): Promise<T> {
    const controller: AbortController = new AbortController();
    const url = `${this.baseUrl}${path}`;

    const config: RequestInit = {
      method,
      signal: controller.signal,
    };

    if (headers) {
      config.headers = headers;
    }

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.timeout);

    try {
      const res = await fetch(url, config);

      if (!res.ok) {
        throw new HttpClientError(`HTTP error!`, {
          status: res.status,
          method,
          url,
          code: 'HTTP_ERROR',
        });
      }

      try {
        return (await res.json()) as T;
      } catch {
        throw new HttpClientError(`Parsing error!`, {
          method,
          url,
          code: 'PARSE_ERROR',
        });
      }
    } catch (error) {
      if (error instanceof HttpClientError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new HttpClientError(`Request timed out`, {
          method,
          url,
          code: 'TIMEOUT_ERROR',
        });
      }

      throw new HttpClientError(`Network request failed`, {
        method,
        url,
        code: 'NETWORK_ERROR',
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(httpMethods.get, path);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    const headers = {
      'content-type': 'application/json',
    };

    return this.request<T>(httpMethods.post, path, headers, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(httpMethods.delete, path);
  }
}
