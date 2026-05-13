import { createTypedStorage, TypedStorageError } from '@frontend-showcase/sdk';

/**
 * Persistent user preferences for the catalog. These are personal UX prefs that intentionally do
 * NOT live in the URL: they should be remembered across sessions on this machine, but they don't
 * belong in shareable links.
 */
export interface CatalogPreferencesType {
  filtersOpen: boolean;
}

const STORAGE_KEY = 'preferences';
const DEFAULT_PREFERENCES: CatalogPreferencesType = {
  filtersOpen: false,
};

const storage = createTypedStorage({ prefix: 'catalog:' });

export function readCatalogPreferences(): CatalogPreferencesType {
  try {
    const stored = storage.get<Partial<CatalogPreferencesType>>(STORAGE_KEY);
    if (!stored) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...stored };
  } catch (error) {
    if (error instanceof TypedStorageError) {
      return DEFAULT_PREFERENCES;
    }
    throw error;
  }
}

export function writeCatalogPreferences(next: CatalogPreferencesType): void {
  try {
    storage.set<CatalogPreferencesType>(STORAGE_KEY, next);
  } catch (error) {
    if (error instanceof TypedStorageError) return;
    throw error;
  }
}
