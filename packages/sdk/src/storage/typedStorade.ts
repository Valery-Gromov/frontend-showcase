import { getDefaultStorage } from './helpers';
import {
  typedStorageErrorCodes,
  TypedStorageError,
  type TypedStorageConfigType,
} from './types';

class TypedStorage {
  private readonly prefix: string;
  private readonly storage: Storage | null;

  constructor(config: TypedStorageConfigType = {}) {
    this.prefix = config.prefix ?? '';
    this.storage = config.storage ?? getDefaultStorage();
  }

  private resolveKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private getStorage(): Storage {
    if (!this.storage) {
      throw new TypedStorageError('Storage is not available in this environment', {
        code: typedStorageErrorCodes.unavailable,
      });
    }
    return this.storage;
  }

  /**
   * Читает значение, сохранённое через JSON. Если ключа нет — `null`.
   */
  get<T>(key: string): T | null {
    const storage = this.getStorage();
    const fullKey = this.resolveKey(key);
    const raw = storage.getItem(fullKey);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new TypedStorageError('Failed to parse stored value', {
        key: fullKey,
        code: typedStorageErrorCodes.parseError,
      });
    }
  }

  /**
   * Сохраняет значение как JSON.
   */
  set<T>(key: string, value: T): void {
    const storage = this.getStorage();
    const fullKey = this.resolveKey(key);
    let serialized: string;
    try {
      serialized = JSON.stringify(value);
    } catch {
      throw new TypedStorageError('Failed to serialize value', {
        key: fullKey,
        code: typedStorageErrorCodes.serializeError,
      });
    }
    try {
      storage.setItem(fullKey, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new TypedStorageError('Storage quota exceeded', {
          key: fullKey,
          code: typedStorageErrorCodes.quotaExceeded,
        });
      }
      throw new TypedStorageError('Failed to write to storage', {
        key: fullKey,
        code: typedStorageErrorCodes.unavailable,
      });
    }
  }

  /**
   * Строка без JSON — удобно для простых токенов и совместимости со старыми значениями.
   */
  getRaw(key: string): string | null {
    const storage = this.getStorage();
    return storage.getItem(this.resolveKey(key));
  }

  setRaw(key: string, value: string): void {
    const storage = this.getStorage();
    const fullKey = this.resolveKey(key);
    try {
      storage.setItem(fullKey, value);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new TypedStorageError('Storage quota exceeded', {
          key: fullKey,
          code: typedStorageErrorCodes.quotaExceeded,
        });
      }
      throw new TypedStorageError('Failed to write to storage', {
        key: fullKey,
        code: typedStorageErrorCodes.unavailable,
      });
    }
  }

  remove(key: string): void {
    const storage = this.getStorage();
    storage.removeItem(this.resolveKey(key));
  }

  has(key: string): boolean {
    const storage = this.getStorage();
    return storage.getItem(this.resolveKey(key)) !== null;
  }

  /**
   * Удаляет все ключи, начинающиеся с `prefix`. Без префикса в конфиге — ошибка, чтобы не очистить весь `localStorage` случайно.
   */
  clearNamespace(): void {
    if (this.prefix === '') {
      throw new TypedStorageError(
        'clearNamespace requires a non-empty prefix in config',
        { code: typedStorageErrorCodes.invalidOperation },
      );
    }
    const storage = this.getStorage();
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k !== null && k.startsWith(this.prefix)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      storage.removeItem(k);
    }
  }
}

function createTypedStorage(config?: TypedStorageConfigType): TypedStorage {
  return new TypedStorage(config);
}

export {
  createTypedStorage,
  TypedStorage,
  TypedStorageError,
  typedStorageErrorCodes,
};
export type { TypedStorageConfigType, TypedStorageErrorCodeType, TypedStorageErrorType } from './types';
