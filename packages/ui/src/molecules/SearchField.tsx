import { useEffect, useState } from 'react';
import { IconButton } from '../atoms/IconButton';
import { TextInput } from '../atoms/TextInput';

export type SearchFieldProps = {
  value: string;
  placeholder?: string;
  loading?: boolean;
  debounceMs?: number;
  onChange: (value: string) => void;
  onClear?: () => void;
};

export function SearchField({
  value,
  placeholder = 'Search',
  loading = false,
  debounceMs,
  onChange,
  onClear,
}: SearchFieldProps) {
  const [innerValue, setInnerValue] = useState(value);

  useEffect(() => {
    setInnerValue(value);
  }, [value]);

  useEffect(() => {
    if (!debounceMs || debounceMs <= 0) {
      return;
    }
    const timeoutId = setTimeout(() => {
      onChange(innerValue);
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [debounceMs, innerValue, onChange]);

  const handleValueChange = (next: string) => {
    setInnerValue(next);
    if (!debounceMs || debounceMs <= 0) {
      onChange(next);
    }
  };

  const handleClear = () => {
    setInnerValue('');
    if (onClear) {
      onClear();
      return;
    }
    onChange('');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
      <TextInput
        value={innerValue}
        onValueChange={handleValueChange}
        placeholder={placeholder}
        pending={loading}
      />
      <IconButton
        icon="x"
        label="Clear search"
        onClick={handleClear}
        disabled={!innerValue || loading}
      />
    </div>
  );
}
