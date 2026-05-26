import { useEffect, useState } from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { LoginScreen } from "../src/screens/LoginScreen";
import { MainTabs } from "../src/screens/MainTabs";
import { HouseholdSetupScreen } from "../src/screens/HouseholdSetupScreen";
import { pb } from "../src/lib/pocketbase";
import { useHousehold } from "@/context/household-context";

export default function Index() {
  const theme = useTheme();
  const [loggedIn, setLoggedIn] = useState(pb.authStore.isValid);
  const { households, activeHousehold, loading, refreshHouseholds } = useHousehold();

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setLoggedIn(pb.authStore.isValid);
    });
    return () => unsubscribe();
  }, []);

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 24 }}>
        <Text variant="bodyLarge">Lade WG...</Text>
      </View>
    );
  }

  if (households.length === 0) {
    return <HouseholdSetupScreen onHouseholdReady={refreshHouseholds} />;
  }

  return (
    <MainTabs
      onLogout={() => {
        pb.authStore.clear();
        setLoggedIn(false);
      }}
    />
  );
}