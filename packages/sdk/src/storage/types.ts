export interface TypedStorageConfigType {
  /** Префикс для всех ключей (например `app:`), чтобы не пересекаться с другими данными в storage. */
  prefix?: string;
  /** Подмена storage (тесты, sessionStorage и т.д.). По умолчанию `localStorage`. */
  storage?: Storage;
}

export const typedStorageErrorCodes = {
  quotaExceeded: 'QUOTA_EXCEEDED',
  parseError: 'PARSE_ERROR',
  serializeError: 'SERIALIZE_ERROR',
  unavailable: 'UNAVAILABLE',
  invalidOperation: 'INVALID_OPERATION',
} as const;

export type TypedStorageErrorCodeType =
  (typeof typedStorageErrorCodes)[keyof typeof typedStorageErrorCodes];

export interface TypedStorageErrorType {
  key?: string;
  code?: TypedStorageErrorCodeType;
}

export class TypedStorageError extends Error {
  key?: string;
  code?: TypedStorageErrorCodeType;

  constructor(message: string, options?: TypedStorageErrorType) {
    super(message);
    this.name = 'TypedStorageError';
    this.key = options?.key;
    this.code = options?.code;
  }
}
