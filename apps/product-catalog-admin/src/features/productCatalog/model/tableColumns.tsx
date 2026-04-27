import { StatusBadge, type DataTableColumn } from '@frontend-showcase/ui';
import type { Product } from './types';

export function getProductTableColumns(): DataTableColumn<Product>[] {
  return [
    { key: 'name', label: 'Name', sortable: true, renderCell: (row) => row.name },
    { key: 'brand', label: 'Brand', sortable: true, renderCell: (row) => row.brand },
    { key: 'category', label: 'Category', sortable: true, renderCell: (row) => row.category },
    { key: 'sae', label: 'SAE', sortable: true, renderCell: (row) => row.sae },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      renderCell: (row) => (
        <StatusBadge status={row.status} tooltip={`Updated at ${new Date(row.updatedAt).toLocaleString()}`} />
      ),
    },
  ];
}
