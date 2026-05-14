import { IconButton, useTheme } from '@frontend-showcase/ui';
import type { ThemeMode } from '@frontend-showcase/ui';

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const ICON: Record<ThemeMode, string> = {
  system: 'SYS',
  light: 'L',
  dark: 'D',
};

const LABEL: Record<ThemeMode, string> = {
  system: 'Theme: system. Switch to light',
  light: 'Theme: light. Switch to dark',
  dark: 'Theme: dark. Switch to system',
};

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  return <IconButton icon={ICON[mode]} label={LABEL[mode]} onClick={() => setMode(NEXT_MODE[mode])} />;
}
