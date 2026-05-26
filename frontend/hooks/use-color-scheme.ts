import { useThemeContext } from '@/context/theme-context';

export function useColorScheme() {
  return useThemeContext().colorScheme;
}

