import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text, useTheme } from "react-native-paper";
import { LoginScreen } from "../src/screens/LoginScreen";
import { MainTabs } from "../src/screens/MainTabs";
import { HouseholdSetupScreen } from "../src/screens/HouseholdSetupScreen";
import { pb } from "../src/lib/pocketbase";
import { useHousehold } from "@/context/household-context";

export default function Index() {
  const [loggedIn, setLoggedIn] = useState(pb.authStore.isValid);
  const { households, loading, refreshHouseholds } = useHousehold();
  const params = useLocalSearchParams<{ poll?: string | string[] }>();
  const hasPollLink = Array.isArray(params.poll) ? params.poll.length > 0 : Boolean(params.poll);

  return (
    <IndexContent
      loggedIn={loggedIn}
      setLoggedIn={setLoggedIn}
      households={households}
      loading={loading}
      refreshHouseholds={refreshHouseholds}
      initialTabName={hasPollLink ? "Umfragen" : undefined}
    />
  );
}

function IndexContent({
  loggedIn,
  setLoggedIn,
  households,
  loading,
  refreshHouseholds,
  initialTabName,
}: {
  loggedIn: boolean;
  setLoggedIn: Dispatch<SetStateAction<boolean>>;
  households: ReturnType<typeof useHousehold>["households"];
  loading: boolean;
  refreshHouseholds: ReturnType<typeof useHousehold>["refreshHouseholds"];
  initialTabName?: string;
}) {
  const theme = useTheme();

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setLoggedIn(pb.authStore.isValid);
    });
    return () => unsubscribe();
  }, [setLoggedIn]);

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
      initialTabName={initialTabName}
      onLogout={() => {
        pb.authStore.clear();
        setLoggedIn(false);
      }}
    />
  );
}
