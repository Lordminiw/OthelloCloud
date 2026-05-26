import { View } from "react-native";
import { Button, Card, List, Text } from "react-native-paper";
import { Household } from "../lib/household";
import { pb } from "../lib/pocketbase";

export function ProfileScreen({
  household,
  onLogout,
}: {
  household: Household;
  onLogout: () => void;
}) {
  const user = pb.authStore.model;

  function logout() {
    pb.authStore.clear();
    onLogout();
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f6f6", padding: 16, gap: 12 }}>
      <Text variant="headlineMedium">Profil</Text>

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
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="WG" subtitle={household.name} />
        <Card.Content>
          <List.Item
            title="Invite-Code"
            description={household.inviteCode}
            left={(props) => <List.Icon {...props} icon="account-plus" />}
          />

          <Text variant="bodyMedium">
            Teile diesen Code mit neuen Mitbewohnern, damit sie deiner WG
            beitreten können.
          </Text>
        </Card.Content>
      </Card>

      <Button mode="contained-tonal" onPress={logout}>
        Ausloggen
      </Button>
    </View>
  );
}