import { Badge, Button } from '@frontend-showcase/ui';
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
        <Badge variant={isRefreshing ? 'warning' : 'neutral'}>
          {isRefreshing ? 'Refreshing...' : `Updated: ${lastUpdatedAt || '-'}`}
        </Badge>
      </div>
    </header>
  );
}
