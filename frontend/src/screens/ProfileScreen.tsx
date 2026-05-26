import { View } from "react-native";
import { Button, Card, List, Text } from "react-native-paper";
import { pb } from "../lib/pocketbase";

export function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const user = pb.authStore.model;

  function logout() {
    pb.authStore.clear();
    onLogout();
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f6f6", padding: 16 }}>
      <Text variant="headlineMedium" style={{ marginBottom: 12 }}>
        Profil
      </Text>

      <Card>
        <Card.Title title={user?.name || "Benutzer"} subtitle={user?.email} />
        <Card.Content>
          <List.Item
            title="User-ID"
            description={user?.id ?? "Unbekannt"}
            left={(props) => <List.Icon {...props} icon="identifier" />}
          />

          <List.Item
            title="Verifiziert"
            description={user?.verified ? "Ja" : "Nein"}
            left={(props) => <List.Icon {...props} icon="check-circle" />}
          />

          <Button mode="contained-tonal" onPress={logout}>
            Ausloggen
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}