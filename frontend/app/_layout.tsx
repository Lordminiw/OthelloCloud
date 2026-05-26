import { Stack } from "expo-router";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationProvider } from "@react-navigation/native";
import { ThemeProvider, useThemeContext } from "@/context/theme-context";
import { HouseholdProvider } from "@/context/household-context";
import { ThemeToggle } from "@/components/theme-toggle";

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2563eb",
    background: "#f6f6f6",
    surface: "#ffffff",
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#3b82f6",
    background: "#121212",
    surface: "#1e1e1e",
  },
};

const customLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#2563eb",
    background: "#f6f6f6",
    card: "#ffffff",
    text: "#111827",
    border: "rgba(0,0,0,0.08)",
  },
};

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#3b82f6",
    background: "#121212",
    card: "#1e1e1e",
    text: "#ecedee",
    border: "rgba(255,255,255,0.08)",
  },
};

function RootLayoutContent() {
  const { colorScheme } = useThemeContext();
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;
  const navTheme = colorScheme === "dark" ? customDarkTheme : customLightTheme;

  return (
    <NavigationProvider value={navTheme}>
      <PaperProvider theme={theme}>
        <HouseholdProvider>
          <Stack />
          <ThemeToggle />
        </HouseholdProvider>
      </PaperProvider>
    </NavigationProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}