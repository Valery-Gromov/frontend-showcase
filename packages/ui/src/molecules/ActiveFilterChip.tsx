import { Chip } from '../atoms/Chip';
import { IconButton } from '../atoms/IconButton';

export type ActiveFilterChipProps = {
  label: string;
  valueLabel: string;
  onRemove: () => void;
};

export function ActiveFilterChip({ label, valueLabel, onRemove }: ActiveFilterChipProps) {
  return (
    <Chip>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span>{`${label}: ${valueLabel}`}</span>
        <IconButton icon="x" label={`Remove ${label} filter`} onClick={onRemove} />
      </span>
    </Chip>
  );
}
