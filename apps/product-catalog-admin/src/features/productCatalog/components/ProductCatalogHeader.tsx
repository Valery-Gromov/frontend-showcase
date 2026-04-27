import { Badge } from '@frontend-showcase/ui';
import type { TableLoadState } from '../model/types';

type ProductCatalogHeaderProps = {
  loadState: TableLoadState;
  lastUpdatedAt: string;
};

export function ProductCatalogHeader({ loadState, lastUpdatedAt }: ProductCatalogHeaderProps) {
  const isRefreshing = loadState.status === 'refreshLoading';

  return (
    <header className="header">
      <h1>Product Catalog Admin</h1>
      <div className="header-meta">
        <Badge variant="info">URL-driven query</Badge>
        <Badge variant={isRefreshing ? 'warning' : 'neutral'}>
          {isRefreshing ? 'Refreshing...' : `Updated: ${lastUpdatedAt || '-'}`}
        </Badge>
      </div>
    </header>
  );
}
