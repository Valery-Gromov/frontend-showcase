export type HttpMethod = 'GET' | 'POST' | 'DELETE';

export const httpMethods = {
  get: 'GET',
  post: 'POST',
  delete: 'DELETE',
} as const;

export interface HttpClientConfigType {
  baseUrl: string;
  timeout?: number;
}

export type HttpClientErrorCodeType =
  | 'HTTP_ERROR'
  | 'TIMEOUT_ERROR'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR';

export interface HttpClientErrorType {
  status?: number;
  method?: HttpMethod;
  url?: string;
  code?: HttpClientErrorCodeType;
}

export class HttpClientError extends Error {
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
