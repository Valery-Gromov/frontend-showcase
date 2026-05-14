import { Badge, Button } from '@frontend-showcase/ui';
import { ThemeToggle } from '../../../app/ThemeToggle';
import type { TableLoadState } from '../model/types';

type ProductCatalogHeaderProps = {
  loadState: TableLoadState;
  lastUpdatedAt: string;
  onAddProduct: () => void;
  onOpenImport: () => void;
};

export function ProductCatalogHeader({
  loadState,
  lastUpdatedAt,
  onAddProduct,
  onOpenImport,
}: ProductCatalogHeaderProps) {
  const isRefreshing = loadState.status === 'refreshLoading';
  const statusText = isRefreshing ? 'Refreshing catalog data' : `Catalog updated: ${lastUpdatedAt || 'not yet'}`;

  return (
    <header className="header">
      <h1>Product Catalog Admin</h1>
      <div className="header-meta">
        <Button variant="secondary" onClick={onOpenImport}>
          Update from Excel
        </Button>
        <Button variant="primary" onClick={onAddProduct}>
          Add product
        </Button>
        <Badge variant="info">URL-driven query</Badge>
        <Badge variant={isRefreshing ? 'warning' : 'neutral'} aria-hidden="true">
          {isRefreshing ? 'Refreshing...' : `Updated: ${lastUpdatedAt || '-'}`}
        </Badge>
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {statusText}
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
