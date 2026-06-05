import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme, Theme as NavigationTheme } from "@react-navigation/native";
import {
  MD3DarkTheme,
  MD3LightTheme,
  MD3Theme,
  useTheme as usePaperTheme,
} from "react-native-paper";
import { Platform } from "react-native";

export type ThemeMode = "light" | "dark";

type BrandPalette = {
  base: string;
  baseAlt: string;
  panel: string;
  panelAlt: string;
  chrome: string;
  chromeStrong: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  divider: string;
  glow: string;
  success: string;
  warning: string;
  danger: string;
};

type BrandTheme = {
  palette: BrandPalette;
  isDark: boolean;
  heroOverlay: string[];
  panelOverlay: string[];
  shadowColor: string;
  spacing: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  motion: {
    quick: number;
    normal: number;
  };
};

export type AppTheme = MD3Theme & {
  brand: BrandTheme;
};

const darkPalette: BrandPalette = {
  base: "#050505",
  baseAlt: "#0b0b0c",
  panel: "#101112",
  panelAlt: "#17181a",
  chrome: "rgba(207, 180, 94, 0.14)",
  chromeStrong: "rgba(207, 180, 94, 0.34)",
  accent: "#c9a449",
  accentStrong: "#f2d98a",
  accentSoft: "rgba(201, 164, 73, 0.18)",
  text: "#f4efe3",
  textMuted: "#b3ac9f",
  divider: "rgba(233, 217, 178, 0.14)",
  glow: "rgba(201, 164, 73, 0.18)",
  success: "#7acb8b",
  warning: "#dbab54",
  danger: "#ef7665",
};

const lightPalette: BrandPalette = {
  base: "#f5f1e8",
  baseAlt: "#ffffff",
  panel: "#fffdf7",
  panelAlt: "#f7f0e5",
  chrome: "rgba(125, 17, 24, 0.09)",
  chromeStrong: "rgba(125, 17, 24, 0.24)",
  accent: "#8a1319",
  accentStrong: "#c41d2b",
  accentSoft: "rgba(138, 19, 25, 0.1)",
  text: "#170f0f",
  textMuted: "#6b5858",
  divider: "rgba(50, 18, 18, 0.12)",
  glow: "rgba(138, 19, 25, 0.1)",
  success: "#1c7a4f",
  warning: "#9e5d11",
  danger: "#b11c28",
};

const fonts = Platform.select({
  ios: {
    bodyLarge: {
      fontFamily: "System",
      fontWeight: "500" as const,
      letterSpacing: 0.15,
    },
    bodyMedium: {
      fontFamily: "System",
      fontWeight: "400" as const,
      letterSpacing: 0.1,
    },
    headlineMedium: {
      fontFamily: "System",
      fontWeight: "700" as const,
      letterSpacing: -0.2,
    },
    titleLarge: {
      fontFamily: "System",
      fontWeight: "700" as const,
      letterSpacing: 0.2,
    },
    labelLarge: {
      fontFamily: "System",
      fontWeight: "700" as const,
      letterSpacing: 1,
    },
    labelMedium: {
      fontFamily: "System",
      fontWeight: "700" as const,
      letterSpacing: 0.8,
    },
  },
  default: {
    bodyLarge: {
      fontFamily: "sans-serif",
      fontWeight: "500" as const,
      letterSpacing: 0.15,
    },
    bodyMedium: {
      fontFamily: "sans-serif",
      fontWeight: "400" as const,
      letterSpacing: 0.1,
    },
    headlineMedium: {
      fontFamily: "sans-serif",
      fontWeight: "700" as const,
      letterSpacing: -0.2,
    },
    titleLarge: {
      fontFamily: "sans-serif",
      fontWeight: "700" as const,
      letterSpacing: 0.2,
    },
    labelLarge: {
      fontFamily: "sans-serif",
      fontWeight: "700" as const,
      letterSpacing: 1,
    },
    labelMedium: {
      fontFamily: "sans-serif",
      fontWeight: "700" as const,
      letterSpacing: 0.8,
    },
  },
  web: {
    bodyLarge: {
      fontFamily:
        "'Segoe UI', 'Hiragino Sans', 'Yu Gothic UI', 'Noto Sans JP', sans-serif",
      fontWeight: "500" as const,
      letterSpacing: 0.15,
    },
    bodyMedium: {
      fontFamily:
        "'Segoe UI', 'Hiragino Sans', 'Yu Gothic UI', 'Noto Sans JP', sans-serif",
      fontWeight: "400" as const,
      letterSpacing: 0.1,
    },
    headlineMedium: {
      fontFamily:
        "'Aptos Display', 'Segoe UI', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
      fontWeight: "700" as const,
      letterSpacing: -0.2,
    },
    titleLarge: {
      fontFamily:
        "'Aptos', 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif",
      fontWeight: "700" as const,
      letterSpacing: 0.2,
    },
    labelLarge: {
      fontFamily:
        "'Aptos', 'Segoe UI', 'Yu Gothic UI', 'Noto Sans JP', sans-serif",
      fontWeight: "700" as const,
      letterSpacing: 1,
    },
    labelMedium: {
      fontFamily:
        "'Aptos', 'Segoe UI', 'Yu Gothic UI', 'Noto Sans JP', sans-serif",
      fontWeight: "700" as const,
      letterSpacing: 0.8,
    },
  },
});

const sharedBrand = {
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
    pill: 999,
  },
  motion: {
    quick: 140,
    normal: 260,
  },
};

export const Colors = {
  light: {
    text: lightPalette.text,
    background: lightPalette.base,
    tint: lightPalette.accent,
    icon: lightPalette.textMuted,
    tabIconDefault: lightPalette.textMuted,
    tabIconSelected: lightPalette.accent,
  },
  dark: {
    text: darkPalette.text,
    background: darkPalette.base,
    tint: darkPalette.accent,
    icon: darkPalette.textMuted,
    tabIconDefault: darkPalette.textMuted,
    tabIconSelected: darkPalette.accentStrong,
  },
};

function buildPaperTheme(mode: ThemeMode): AppTheme {
  const isDark = mode === "dark";
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  const palette = isDark ? darkPalette : lightPalette;

  return {
    ...baseTheme,
    roundness: sharedBrand.radius.md,
    fonts: {
      ...baseTheme.fonts,
      bodyLarge: { ...baseTheme.fonts.bodyLarge, ...fonts.bodyLarge },
      bodyMedium: { ...baseTheme.fonts.bodyMedium, ...fonts.bodyMedium },
      headlineMedium: {
        ...baseTheme.fonts.headlineMedium,
        ...fonts.headlineMedium,
      },
      titleLarge: { ...baseTheme.fonts.titleLarge, ...fonts.titleLarge },
      labelLarge: { ...baseTheme.fonts.labelLarge, ...fonts.labelLarge },
      labelMedium: { ...baseTheme.fonts.labelMedium, ...fonts.labelMedium },
    },
    colors: {
      ...baseTheme.colors,
      primary: palette.accent,
      onPrimary: isDark ? "#170f00" : "#fff8f7",
      primaryContainer: palette.accentSoft,
      onPrimaryContainer: palette.text,
      secondary: palette.accentStrong,
      onSecondary: isDark ? "#201703" : "#fff7f7",
      secondaryContainer: palette.accentSoft,
      onSecondaryContainer: palette.text,
      tertiary: palette.chromeStrong,
      onTertiary: palette.text,
      tertiaryContainer: palette.panelAlt,
      onTertiaryContainer: palette.text,
      error: palette.danger,
      onError: "#fff8f7",
      errorContainer: isDark ? "rgba(239, 118, 101, 0.16)" : "rgba(177, 28, 40, 0.12)",
      onErrorContainer: palette.text,
      background: palette.base,
      onBackground: palette.text,
      surface: palette.panel,
      onSurface: palette.text,
      surfaceVariant: palette.panelAlt,
      onSurfaceVariant: palette.textMuted,
      outline: palette.chromeStrong,
      outlineVariant: palette.divider,
      inverseSurface: isDark ? "#f6eacf" : "#211919",
      inverseOnSurface: isDark ? "#16120d" : "#f8f2eb",
      inversePrimary: palette.accentStrong,
      elevation: {
        level0: "transparent",
        level1: palette.panel,
        level2: palette.panelAlt,
        level3: palette.panelAlt,
        level4: palette.panelAlt,
        level5: palette.panelAlt,
      },
      shadow: isDark ? "#000000" : "#3d2020",
      scrim: "rgba(0,0,0,0.55)",
      surfaceDisabled: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
      onSurfaceDisabled: isDark ? "rgba(255,255,255,0.36)" : "rgba(0,0,0,0.3)",
      backdrop: "rgba(4, 4, 5, 0.68)",
    },
    brand: {
      palette,
      isDark,
      heroOverlay: isDark
        ? ["rgba(201, 164, 73, 0.18)", "rgba(255,255,255,0.02)"]
        : ["rgba(196, 29, 43, 0.12)", "rgba(255,255,255,0.6)"],
      panelOverlay: isDark
        ? ["rgba(255,255,255,0.02)", "rgba(201, 164, 73, 0.08)"]
        : ["rgba(255,255,255,0.8)", "rgba(138, 19, 25, 0.06)"],
      shadowColor: isDark ? "#000000" : "rgba(52, 24, 24, 0.22)",
      ...sharedBrand,
    },
  };
}

function buildNavigationTheme(theme: AppTheme): NavigationTheme {
  return {
    ...(theme.brand.isDark ? NavigationDarkTheme : NavigationLightTheme),
    dark: theme.brand.isDark,
    colors: {
      ...(theme.brand.isDark
        ? NavigationDarkTheme.colors
        : NavigationLightTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
      notification: theme.colors.secondary,
    },
    fonts: Platform.select({
      web: {
        regular: {
          fontFamily:
            "'Segoe UI', 'Hiragino Sans', 'Yu Gothic UI', 'Noto Sans JP', sans-serif",
          fontWeight: "400",
        },
        medium: {
          fontFamily:
            "'Aptos', 'Segoe UI', 'Yu Gothic UI', 'Noto Sans JP', sans-serif",
          fontWeight: "600",
        },
        bold: {
          fontFamily:
            "'Aptos Display', 'Segoe UI', 'Yu Gothic UI', 'Noto Sans JP', sans-serif",
          fontWeight: "700",
        },
        heavy: {
          fontFamily:
            "'Aptos Display', 'Segoe UI', 'Yu Gothic UI', 'Noto Sans JP', sans-serif",
          fontWeight: "800",
        },
      },
      default: NavigationLightTheme.fonts,
    }),
  };
}

export const appThemes = {
  light: buildPaperTheme("light"),
  dark: buildPaperTheme("dark"),
};

export const navigationThemes = {
  light: buildNavigationTheme(appThemes.light),
  dark: buildNavigationTheme(appThemes.dark),
};

export function useAppTheme() {
  return usePaperTheme<AppTheme>();
}
