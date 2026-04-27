import { Button } from '@frontend-showcase/ui';

type ProductCatalogPaginationProps = {
  page: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function ProductCatalogPagination({
  page,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: ProductCatalogPaginationProps) {
  return (
    <div className="pagination">
      <Button variant="secondary" onClick={onPrevious} disabled={!canGoPrevious}>
        Previous
      </Button>
      <span>Page {page}</span>
      <Button variant="secondary" onClick={onNext} disabled={!canGoNext}>
        Next
      </Button>
    </div>
  );
}
