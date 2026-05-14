import { useEffect, useRef, useState } from 'react';
import { IconButton } from '../atoms/IconButton';
import { TextInput } from '../atoms/TextInput';
import styles from './SearchField.module.css';

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
  const [draftValue, setDraftValue] = useState(value);
  const initializedRef = useRef(false);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    if (!debounceMs || debounceMs <= 0) {
      onChange(draftValue);
      return;
    }
    const timeoutId = setTimeout(() => onChange(draftValue), debounceMs);
    return () => clearTimeout(timeoutId);
  }, [debounceMs, draftValue, onChange]);

  return (
    <div className={styles.searchField}>
      <TextInput
        value={draftValue}
        onValueChange={setDraftValue}
        placeholder={placeholder}
        pending={loading}
        clearable
        className={styles.input}
        onClear={() => {
          if (onClear) onClear();
          setDraftValue('');
          onChange('');
        }}
      />
      <IconButton
        icon="x"
        label="Clear search"
        onClick={() => {
          if (onClear) onClear();
          setDraftValue('');
          onChange('');
        }}
        disabled={!draftValue}
      />
    </div>
  );
}
