import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { LoginScreen } from "../src/screens/LoginScreen";
import { ShoppingListScreen } from "../src/screens/ShoppingListScreen";
import { pb } from "../src/lib/pocketbase";
import { getCurrentUserHousehold, Household } from "../src/lib/household";
import { MainTabs } from "../src/screens/MainTabs";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(pb.authStore.isValid);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadHousehold() {
    setLoading(true);
    try {
      const result = await getCurrentUserHousehold();
      setHousehold(result);
    } catch (error) {
      console.log("HOUSEHOLD LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loggedIn) {
      loadHousehold();
    }
  }, [loggedIn]);

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "white", padding: 24 }}>
        <Text style={{ color: "black" }}>Lade WG...</Text>
      </View>
    );
  }

  if (!household) {
    return (
      <View style={{ flex: 1, backgroundColor: "white", padding: 24 }}>
        <Text style={{ color: "black" }}>Du bist noch keiner WG zugeordnet.</Text>
      </View>
    );
  }

  return (
    <MainTabs
      householdId={household.id}
      onLogout={() => {
        setLoggedIn(false);
        setHousehold(null);
      }}
    />
  );
}
