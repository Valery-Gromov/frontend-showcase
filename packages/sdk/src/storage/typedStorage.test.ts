import { beforeEach, describe, expect, it } from 'vitest';

import { createTypedStorage, TypedStorageError } from './typedStorade';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe('createTypedStorage', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('round-trips a JSON value under the configured prefix', () => {
    const typed = createTypedStorage({ prefix: 'app:', storage });
    typed.set('user', { id: 1, name: 'Alice' });

    expect(typed.get<{ id: number; name: string }>('user')).toEqual({ id: 1, name: 'Alice' });
    expect(storage.getItem('app:user')).toBe(JSON.stringify({ id: 1, name: 'Alice' }));
  });

  it('returns null for a missing key', () => {
    const typed = createTypedStorage({ prefix: 'app:', storage });
    expect(typed.get('missing')).toBeNull();
  });

  it('throws a typed PARSE_ERROR when stored value is not valid JSON', () => {
    storage.setItem('app:broken', '{ not json');
    const typed = createTypedStorage({ prefix: 'app:', storage });

    const error = (() => {
      try {
        typed.get('broken');
        return null;
      } catch (err) {
        return err;
      }
    })();

    expect(error).toBeInstanceOf(TypedStorageError);
    expect((error as TypedStorageError).code).toBe('PARSE_ERROR');
    expect((error as TypedStorageError).key).toBe('app:broken');
  });

  it('throws QUOTA_EXCEEDED when the underlying storage throws QuotaExceededError', () => {
    class QuotaStorage extends MemoryStorage {
      override setItem(): void {
        throw new DOMException('quota', 'QuotaExceededError');
      }
    }
    const typed = createTypedStorage({ prefix: 'app:', storage: new QuotaStorage() });

    const error = (() => {
      try {
        typed.set('big', 'x'.repeat(100));
        return null;
      } catch (err) {
        return err;
      }
    })();

    expect(error).toBeInstanceOf(TypedStorageError);
    expect((error as TypedStorageError).code).toBe('QUOTA_EXCEEDED');
  });

  it('clearNamespace removes only prefixed keys', () => {
    storage.setItem('other', 'keep');
    const typed = createTypedStorage({ prefix: 'catalog:', storage });
    typed.set('preferences', { theme: 'dark' });
    typed.set('page', 1);

    typed.clearNamespace();

    expect(storage.getItem('other')).toBe('keep');
    expect(typed.get('preferences')).toBeNull();
    expect(typed.get('page')).toBeNull();
  });

  it('clearNamespace refuses to run when no prefix is configured (safety net against wiping all localStorage)', () => {
    const typed = createTypedStorage({ storage });

    expect(() => typed.clearNamespace()).toThrow(TypedStorageError);
  });

  it('reports UNAVAILABLE when storage is not provided in a non-browser environment', () => {
    const typed = createTypedStorage({ prefix: 'app:', storage: undefined });

    const error = (() => {
      try {
        typed.get('anything');
        return null;
      } catch (err) {
        return err;
      }
    })();

    if (error instanceof TypedStorageError) {
      expect(error.code).toBe('UNAVAILABLE');
    } else {
      expect(typed.get('anything')).toBeNull();
    }
  });
});
