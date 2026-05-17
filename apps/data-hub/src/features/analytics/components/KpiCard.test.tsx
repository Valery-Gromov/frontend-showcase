import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { KpiCard } from './KpiCard';

describe('KpiCard', () => {
  it('treats lower deltas as favorable for lower-is-better metrics', () => {
    const html = renderToStaticMarkup(
      <KpiCard
        label="Stockouts"
        metric={{ value: 12, delta: -8.5 }}
        kind="number"
        loading={false}
        direction="lower-is-better"
      />,
    );

    expect(html).toContain('data-variant="success"');
    expect(html).toContain('-8.5% vs previous');
  });
});
