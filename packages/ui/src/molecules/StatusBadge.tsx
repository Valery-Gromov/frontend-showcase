import { Badge, type BadgeVariant } from '../atoms/Badge';
import { Tooltip } from '../atoms/Tooltip';

export type StatusBadgeProps = {
  status: 'active' | 'draft' | 'archived';
  tooltip?: string;
};

const variantByStatus: Record<StatusBadgeProps['status'], BadgeVariant> = {
  active: 'success',
  draft: 'warning',
  archived: 'neutral',
};

export function StatusBadge({ status, tooltip }: StatusBadgeProps) {
  const badge = <Badge variant={variantByStatus[status]}>{status}</Badge>;

  if (!tooltip) return badge;

  return <Tooltip content={tooltip}>{badge}</Tooltip>;
}
