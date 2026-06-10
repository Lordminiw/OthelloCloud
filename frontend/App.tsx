import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import {
  NavigationContainer,
  type ParamListBase,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider, Text } from "react-native-paper";
import { ThemeProvider, useThemeContext } from "@/context/theme-context";
import { HouseholdProvider, useHousehold } from "@/context/household-context";
import { LanguageProvider, useLanguage } from "@/context/language-context";
import { createNavigationTheme, createPaperTheme } from "@/src/theme/brand";
import { LoginScreen } from "./src/screens/LoginScreen";
import { HouseholdSetupScreen } from "./src/screens/HouseholdSetupScreen";
import { MainTabs } from "./src/screens/MainTabs";
import { pb } from "./src/lib/pocketbase";
import { resolveTabKey, TabKey } from "@/constants/navigation";

function parseInitialTab(url: string | null) {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    const tabParam = parsed.searchParams.get("tab");

    const resolvedParam = resolveTabKey(tabParam);
    if (resolvedParam) {
      return resolvedParam;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    const lastTab = [...segments].reverse().map((segment) => resolveTabKey(segment)).find(Boolean);

    if (lastTab) {
      return lastTab as TabKey;
    }

    if (parsed.searchParams.has("poll")) {
      return "polls" as const;
    }

    if (parsed.searchParams.has("invite")) {
      return "profile" as const;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function parseInviteCode(url: string | null) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("invite")?.trim().toUpperCase() ?? "";
  } catch {
    return "";
  }
}

function AppShell() {
  const { colorScheme } = useThemeContext();
  const { t } = useLanguage();
  const paperTheme = useMemo(() => createPaperTheme(colorScheme), [colorScheme]);
  const navTheme = useMemo(() => createNavigationTheme(colorScheme), [colorScheme]);
  const navigationRef = useNavigationContainerRef<ParamListBase>();
  const url = Linking.useURL();
  const [loggedIn, setLoggedIn] = useState(pb.authStore.isValid);
  const { households, loading, refreshHouseholds } = useHousehold();

  const initialTabName = useMemo(() => parseInitialTab(url) ?? "home", [url]);
  const initialInviteCode = useMemo(() => parseInviteCode(url), [url]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const search = new URLSearchParams(window.location.search);
    const currentTab = search.get("tab");
    const currentPoll = search.get("poll");
    const currentInvite = search.get("invite");
    const pathnameSegments = window.location.pathname.split("/").filter(Boolean);
    const pathTab = [...pathnameSegments]
      .reverse()
      .map((segment) => resolveTabKey(segment))
      .find(Boolean) as TabKey | undefined;

    const nextTab = resolveTabKey(currentTab) ?? pathTab ?? initialTabName;

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
    if (currentInvite) {
      nextSearch.set("invite", currentInvite);
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
        <Text variant="bodyLarge">{t("common.loadingHousehold")}</Text>
      </View>
    );
  }

  if (households.length === 0) {
    return (
      <HouseholdSetupScreen
        initialInviteCode={initialInviteCode}
        onHouseholdReady={refreshHouseholds}
      />
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      documentTitle={{ enabled: false }}
      onStateChange={() => {
        if (typeof window === "undefined") {
          return;
        }

        const nextTab = resolveTabKey(navigationRef.getCurrentRoute()?.name) ?? "home";
        const search = new URLSearchParams(window.location.search);
        const currentPoll = search.get("poll");
        const currentInvite = search.get("invite");

        const nextSearch = new URLSearchParams();
        nextSearch.set("tab", nextTab);
        if (currentPoll) {
          nextSearch.set("poll", currentPoll);
        }
        if (currentInvite) {
          nextSearch.set("invite", currentInvite);
        }

        const normalized = `/?${nextSearch.toString()}`;
        const current = `${window.location.pathname}${window.location.search}`;

        if (current !== normalized) {
          window.history.replaceState({}, "", normalized);
        }
      }}
    >
      <MainTabs
        initialTabName={initialTabName}
        initialInviteCode={initialInviteCode}
        onLogout={() => {
          pb.authStore.clear();
          setLoggedIn(false);
        }}
      />
    </NavigationContainer>
  );
}

function AppProviders() {
  const { colorScheme } = useThemeContext();
  const paperTheme = useMemo(() => createPaperTheme(colorScheme), [colorScheme]);

  return (
    <LanguageProvider>
      <HouseholdProvider>
        <PaperProvider theme={paperTheme}>
          <AppShell />
        </PaperProvider>
      </HouseholdProvider>
    </LanguageProvider>
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
