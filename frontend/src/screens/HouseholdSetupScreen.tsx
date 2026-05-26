import { useState } from "react";
import { View } from "react-native";
import { Button, Card, Text, TextInput, useTheme } from "react-native-paper";
import { createHousehold, joinHousehold } from "../lib/household";

export function HouseholdSetupScreen({
  onHouseholdReady,
}: {
  onHouseholdReady: () => void;
}) {
  const theme = useTheme();
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreateHousehold() {
    if (!newHouseholdName.trim()) {
      alert("Bitte WG-Namen eingeben.");
      return;
    }

    setBusy(true);

    try {
      await createHousehold(newHouseholdName);
      onHouseholdReady();
    } catch (error: any) {
      console.log("CREATE HOUSEHOLD ERROR:", error);
      console.log("RESPONSE:", error?.response);

      alert(
        "WG konnte nicht erstellt werden.\n\n" +
          "Status: " +
          error?.status +
          "\n" +
          "Message: " +
          error?.message +
          "\n" +
          "Response: " +
          JSON.stringify(error?.response, null, 2)
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinHousehold() {
    if (!inviteCode.trim()) {
      alert("Bitte Invite-Code eingeben.");
      return;
    }

    setBusy(true);

    try {
      await joinHousehold(inviteCode);
      onHouseholdReady();
    } catch (error: any) {
      console.log("JOIN HOUSEHOLD ERROR:", error);
      console.log("RESPONSE:", error?.response);

      alert(
        "WG konnte nicht gefunden oder nicht beigetreten werden.\n\n" +
          "Status: " +
          error?.status +
          "\n" +
          "Message: " +
          error?.message +
          "\n" +
          "Response: " +
          JSON.stringify(error?.response, null, 2)
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16, gap: 12 }}>
      <Text variant="headlineMedium">WG einrichten</Text>

      <Card>
        <Card.Title title="Neue WG erstellen" />
        <Card.Content style={{ gap: 12 }}>
          <Text variant="bodyMedium">
            Erstelle eine neue WG. Du wirst automatisch Admin.
          </Text>

          <TextInput
            label="WG-Name"
            value={newHouseholdName}
            onChangeText={setNewHouseholdName}
            mode="outlined"
            placeholder="z.B. Othello WG"
          />

          <Button
            mode="contained"
            onPress={handleCreateHousehold}
            disabled={busy}
            loading={busy}
          >
            WG erstellen
          </Button>
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Bestehender WG beitreten" />
        <Card.Content style={{ gap: 12 }}>
          <Text variant="bodyMedium">
            Gib den Invite-Code ein, den du von einem WG-Mitglied bekommen hast.
          </Text>

          <TextInput
            label="Invite-Code"
            value={inviteCode}
            onChangeText={(value) => setInviteCode(value.toUpperCase())}
            mode="outlined"
            autoCapitalize="characters"
            placeholder="z.B. ABC123"
          />

          <Button
            mode="outlined"
            onPress={handleJoinHousehold}
            disabled={busy}
            loading={busy}
          >
            WG beitreten
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}