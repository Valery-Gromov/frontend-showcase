import { Checkbox } from '../atoms/Checkbox';
import { Tooltip } from '../atoms/Tooltip';

export type RowCheckboxCellProps = {
  checked: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onChange: (checked: boolean) => void;
};

export function RowCheckboxCell({
  checked,
  disabled = false,
  disabledReason,
  onChange,
}: RowCheckboxCellProps) {
  const checkbox = (
    <Checkbox checked={checked} disabled={disabled} onCheckedChange={onChange} />
  );

  if (disabled && disabledReason) {
    return <Tooltip content={disabledReason}>{checkbox}</Tooltip>;
  }

  return checkbox;
}
