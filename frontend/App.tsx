import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider, MD3LightTheme, MD3DarkTheme, Text } from "react-native-paper";
import { ThemeProvider, useThemeContext } from "@/context/theme-context";
import { HouseholdProvider, useHousehold } from "@/context/household-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginScreen } from "./src/screens/LoginScreen";
import { HouseholdSetupScreen } from "./src/screens/HouseholdSetupScreen";
import { MainTabs } from "./src/screens/MainTabs";
import { pb } from "./src/lib/pocketbase";

const TAB_NAMES = ["Einkauf", "Ausgaben", "Kalender", "Umfragen", "Profil"] as const;

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

function parseInitialTab(url: string | null) {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    const tabParam = parsed.searchParams.get("tab");

    if (tabParam && TAB_NAMES.includes(tabParam as (typeof TAB_NAMES)[number])) {
      return tabParam as (typeof TAB_NAMES)[number];
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    const lastTab = [...segments].reverse().find((segment) =>
      TAB_NAMES.includes(segment as (typeof TAB_NAMES)[number])
    );

    if (lastTab) {
      return lastTab as (typeof TAB_NAMES)[number];
    }

    if (parsed.searchParams.has("poll")) {
      return "Umfragen" as const;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function AppShell() {
  const { colorScheme } = useThemeContext();
  const paperTheme = colorScheme === "dark" ? darkTheme : lightTheme;
  const navTheme = colorScheme === "dark" ? customDarkTheme : customLightTheme;
  const url = Linking.useURL();
  const [loggedIn, setLoggedIn] = useState(pb.authStore.isValid);
  const { households, loading, refreshHouseholds } = useHousehold();

  const initialTabName = useMemo(() => parseInitialTab(url), [url]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const search = new URLSearchParams(window.location.search);
    const currentTab = search.get("tab");
    const currentPoll = search.get("poll");
    const pathnameSegments = window.location.pathname.split("/").filter(Boolean);
    const pathTab = [...pathnameSegments]
      .reverse()
      .find((segment) => TAB_NAMES.includes(segment as (typeof TAB_NAMES)[number]));

    const nextTab = currentTab && TAB_NAMES.includes(currentTab as (typeof TAB_NAMES)[number])
      ? currentTab
      : pathTab ?? initialTabName;

    if (!nextTab) {
      if (window.location.pathname !== "/" || window.location.search) {
        window.history.replaceState({}, "", "/");
      }
      return;
    }

    const nextSearch = new URLSearchParams();
    nextSearch.set("tab", nextTab);
    if (currentPoll) {
      nextSearch.set("poll", currentPoll);
    }

    const normalized = `/?${nextSearch.toString()}`;
    const current = `${window.location.pathname}${window.location.search}`;

    if (current !== normalized) {
      window.history.replaceState({}, "", normalized);
    }
  }, [initialTabName]);

  if (!loggedIn) {
    return (
      <LoginScreen
        onLogin={async () => {
          await refreshHouseholds();
          setLoggedIn(true);
        }}
      />
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: paperTheme.colors.background, padding: 24 }}>
        <Text variant="bodyLarge">Lade WG...</Text>
      </View>
    );
  }

  if (households.length === 0) {
    return <HouseholdSetupScreen onHouseholdReady={refreshHouseholds} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <MainTabs
        initialTabName={initialTabName}
        onLogout={() => {
          pb.authStore.clear();
          setLoggedIn(false);
        }}
      />
      <ThemeToggle />
    </NavigationContainer>
  );
}

function AppProviders() {
  const { colorScheme } = useThemeContext();
  const paperTheme = colorScheme === "dark" ? darkTheme : lightTheme;

  return (
    <HouseholdProvider>
      <PaperProvider theme={paperTheme}>
        <AppShell />
      </PaperProvider>
    </HouseholdProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProviders />
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
