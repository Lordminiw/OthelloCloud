import { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { LoginScreen } from "../src/screens/LoginScreen";
import { MainTabs } from "../src/screens/MainTabs";
import { HouseholdSetupScreen } from "../src/screens/HouseholdSetupScreen";
import { getCurrentUserHousehold, Household } from "../src/lib/household";
import { pb } from "../src/lib/pocketbase";

export default function Index() {
  const [loggedIn, setLoggedIn] = useState(pb.authStore.isValid);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadHousehold() {
    setLoading(true);

    try {
      const result = await getCurrentUserHousehold();
      setHousehold(result);
    } catch (error: any) {
      console.log("HOUSEHOLD LOAD ERROR:", error);
      console.log("RESPONSE:", error?.response);
      setHousehold(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loggedIn) {
      loadHousehold();
    } else {
      setHousehold(null);
    }
  }, [loggedIn]);

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f6f6f6", padding: 24 }}>
        <Text variant="bodyLarge">Lade WG...</Text>
      </View>
    );
  }

  if (!household) {
    return <HouseholdSetupScreen onHouseholdReady={loadHousehold} />;
  }

  return (
    <MainTabs
      household={household}
      onLogout={() => {
        pb.authStore.clear();
        setLoggedIn(false);
        setHousehold(null);
      }}
    />
  );
}