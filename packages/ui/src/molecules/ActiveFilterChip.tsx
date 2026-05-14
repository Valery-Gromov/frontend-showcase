import { Chip } from '../atoms/Chip';
import { IconButton } from '../atoms/IconButton';
import styles from './ActiveFilterChip.module.css';

export type ActiveFilterChipProps = {
  label: string;
  valueLabel: string;
  onRemove: () => void;
};

export function ActiveFilterChip({ label, valueLabel, onRemove }: ActiveFilterChipProps) {
  return (
    <Chip>
      <span className={styles.content}>
        <span>{`${label}: ${valueLabel}`}</span>
        <IconButton icon="x" label={`Remove ${label} filter`} onClick={onRemove} />
      </span>
    </Chip>
  );
}
