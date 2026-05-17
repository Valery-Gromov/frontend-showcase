import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TargetPanel } from './TargetPanel';

describe('TargetPanel', () => {
  it('disables the decrement action when the next step would be below the server minimum', () => {
    const html = renderToStaticMarkup(
      <TargetPanel
        target={{ value: 100_000, updatedAt: '2026-05-17T12:00:00.000Z' }}
        currentRevenue={50_000}
        saving={false}
        onChange={() => undefined}
      />,
    );

    expect(html).toContain('disabled=""');
    expect(html).toContain('-50k');
  });
});
