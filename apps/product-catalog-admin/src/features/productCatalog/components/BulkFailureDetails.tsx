import { Button } from '@frontend-showcase/ui';
import type { BulkFailure } from '../model/types';

type BulkFailureDetailsProps = {
  failures: BulkFailure[];
  open: boolean;
  onClose: () => void;
};

export function BulkFailureDetails({ failures, open, onClose }: BulkFailureDetailsProps) {
  if (!open || failures.length === 0) return null;

  return (
    <section className="details-panel" aria-labelledby="bulk-failure-details-title">
      <div className="details-panel-header">
        <h2 id="bulk-failure-details-title">Bulk action failure details</h2>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <ul className="failure-list">
        {failures.map((failure) => (
          <li key={failure.id}>
            <strong>{failure.name ?? `Product ${failure.id}`}</strong>
            <span>{failure.reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
