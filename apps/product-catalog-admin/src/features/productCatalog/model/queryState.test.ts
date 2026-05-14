import { describe, expect, it } from 'vitest';
import {
  areProductQueriesEqual,
  getDefaultFilterDraft,
  getDefaultProductQuery,
  queryFromFilterDraft,
  readProductQueryFromUrl,
  toFilterDraft,
  productQueryToSearchParams,
} from './queryState';
import type { ProductQuery } from './types';

describe('product catalog queryState', () => {
  it('round-trips a non-default query through URLSearchParams', () => {
    const query: ProductQuery = {
      search: 'synthetic oil',
      brand: ['Shell', 'Mobil'],
      category: ['Engine Oil'],
      sae: ['5W-30'],
      status: 'active',
      page: 3,
      pageSize: 25,
      sort: { field: 'name', direction: 'desc' },
    };

    const search = productQueryToSearchParams(query).toString();

    expect(readProductQueryFromUrl(search)).toEqual(query);
  });

  it('normalizes invalid page, pageSize and sort values', () => {
    const parsed = readProductQueryFromUrl('?page=-2&pageSize=0&sort=name:sideways&brand=Shell,,Mobil');

    expect(parsed).toMatchObject({
      brand: ['Shell', 'Mobil'],
      page: 1,
      pageSize: 10,
      sort: null,
    });
  });

  it('omits default values when serializing', () => {
    const params = productQueryToSearchParams(getDefaultProductQuery());

    expect(params.toString()).toBe('');
  });

  it('returns isolated default filter drafts', () => {
    const first = getDefaultFilterDraft();
    first.brand.push('Shell');

    expect(getDefaultFilterDraft().brand).toEqual([]);
  });

  it('converts query to filter draft and applies draft by resetting page', () => {
    const previous: ProductQuery = {
      ...getDefaultProductQuery(),
      page: 4,
      search: 'old',
    };
    const draft = toFilterDraft({
      ...previous,
      search: 'new',
      brand: ['Castrol'],
    });

    expect(queryFromFilterDraft(draft, previous)).toMatchObject({
      search: 'new',
      brand: ['Castrol'],
      page: 1,
    });
  });

  it('compares queries by canonical URL representation', () => {
    const base = getDefaultProductQuery();

    expect(areProductQueriesEqual(base, { ...base, brand: [] })).toBe(true);
    expect(areProductQueriesEqual(base, { ...base, pageSize: 25 })).toBe(false);
  });
});
