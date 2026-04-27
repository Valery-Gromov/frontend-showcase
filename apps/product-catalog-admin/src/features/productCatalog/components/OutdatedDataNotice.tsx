import { Button } from '@frontend-showcase/ui';

type OutdatedDataNoticeProps = {
  visible: boolean;
  refreshing: boolean;
  onRefresh: () => void;
};

export function OutdatedDataNotice({ visible, refreshing, onRefresh }: OutdatedDataNoticeProps) {
  if (!visible) return null;

  return (
    <div className="notice" role="status">
      <span>Data may be outdated.</span>
      <Button variant="secondary" loading={refreshing} onClick={onRefresh}>
        Refresh table
      </Button>
    </div>
  );
}
