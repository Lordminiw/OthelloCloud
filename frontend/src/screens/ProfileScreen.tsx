import { Button, Text, View } from "react-native";
import { pb } from "../lib/pocketbase";

export function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const email = pb.authStore.model?.email;

  function logout() {
    pb.authStore.clear();
    onLogout();
  }

  return (
    <View style={{ flex: 1, backgroundColor: "white", padding: 24, gap: 12 }}>
      <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>
        Profil
      </Text>
      <Text style={{ color: "black" }}>Eingeloggt als: {email}</Text>
      <Button title="Ausloggen" onPress={logout} />
    </View>
  );
}