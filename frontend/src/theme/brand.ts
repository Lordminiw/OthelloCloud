import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  type Theme as NavigationTheme,
} from "@react-navigation/native";
import {
  MD3DarkTheme,
  MD3LightTheme,
  type MD3Theme,
} from "react-native-paper";

export const brand = {
  colors: {
    primary: "#B85C38",
    primarySoft: "#EBC5A8",
    background: "#FFF7F1",
    backgroundMuted: "#F6EFE8",
    surface: "#FFFDFC",
    surfaceVariant: "#F3E7DC",
    outline: "#E7D7C9",
    accent: "#8FA68E",
    text: "#4F342B",
    textMuted: "#7F5B47",
    textDisabled: "#B7A08F",
  },
  radius: {
    hero: 28,
    card: 20,
    control: 16,
    pill: 999,
  },
  spacing: {
    pageX: 18,
    pageTop: 22,
    section: 18,
    card: 16,
    cluster: 10,
  },
} as const;

const darkColors = {
  primary: brand.colors.primarySoft,
  primarySoft: brand.colors.primary,
  background: "#1F1713",
  backgroundMuted: "#2A211C",
  surface: "#2B211D",
  surfaceVariant: "#3A2C26",
  outline: "#6E5648",
  accent: "#A8BCA4",
  text: "#F7EDE5",
  textMuted: "#D4BEAF",
  textDisabled: "#9B8577",
} as const;

export function createPaperTheme(scheme: "light" | "dark"): MD3Theme {
  const baseTheme = scheme === "dark" ? MD3DarkTheme : MD3LightTheme;
  const palette = scheme === "dark" ? darkColors : brand.colors;

  return {
    ...baseTheme,
    roundness: brand.radius.control,
    colors: {
      ...baseTheme.colors,
      primary: palette.primary,
      primaryContainer: palette.primarySoft,
      secondary: palette.accent,
      secondaryContainer: palette.surfaceVariant,
      tertiary: palette.textMuted,
      tertiaryContainer: palette.backgroundMuted,
      surface: palette.surface,
      surfaceVariant: palette.surfaceVariant,
      surfaceDisabled: palette.backgroundMuted,
      background: palette.background,
      onPrimary: scheme === "dark" ? brand.colors.text : brand.colors.surface,
      onPrimaryContainer: scheme === "dark" ? darkColors.text : brand.colors.text,
      onSecondary: scheme === "dark" ? brand.colors.text : brand.colors.surface,
      onSecondaryContainer: scheme === "dark" ? darkColors.text : brand.colors.text,
      onTertiary: scheme === "dark" ? brand.colors.text : brand.colors.surface,
      onTertiaryContainer: scheme === "dark" ? darkColors.text : brand.colors.text,
      onSurface: palette.text,
      onSurfaceVariant: palette.textMuted,
      onSurfaceDisabled: palette.textDisabled,
      onBackground: palette.text,
      outline: palette.outline,
      outlineVariant: palette.outline,
      inverseSurface: scheme === "dark" ? brand.colors.surface : darkColors.surface,
      inverseOnSurface: scheme === "dark" ? brand.colors.text : darkColors.text,
      inversePrimary: scheme === "dark" ? brand.colors.primary : brand.colors.primarySoft,
      backdrop: baseTheme.colors.backdrop,
      elevation: {
        ...baseTheme.colors.elevation,
        level0: palette.background,
        level1: palette.backgroundMuted,
        level2: palette.surfaceVariant,
        level3: palette.surface,
        level4: palette.surface,
        level5: palette.surface,
      },
    },
  };
}

export function createNavigationTheme(scheme: "light" | "dark"): NavigationTheme {
  const baseTheme = scheme === "dark" ? NavigationDarkTheme : NavigationDefaultTheme;
  const palette = scheme === "dark" ? darkColors : brand.colors;

  return {
    ...baseTheme,
    dark: scheme === "dark",
    colors: {
      ...baseTheme.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.outline,
      notification: brand.colors.accent,
    },
  };
}
