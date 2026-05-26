import { useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Button,
  Card,
  Dialog,
  Divider,
  List,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { Household } from "../lib/household";
import { pb } from "../lib/pocketbase";
import { useHousehold } from "@/context/household-context";
import { HouseholdDropdown } from "@/components/household-dropdown";

export function ProfileScreen({
  household,
  onLogout,
}: {
  household: Household;
  onLogout: () => void;
}) {
  const theme = useTheme();
  const user = pb.authStore.model;
  const { households, createNewHousehold, joinNewHousehold } = useHousehold();

  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [joinDialogVisible, setJoinDialogVisible] = useState(false);
  const [newWgName, setNewWgName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);

  function logout() {
    pb.authStore.clear();
    onLogout();
  }

  async function handleCreate() {
    if (!newWgName.trim()) {
      alert("Bitte WG-Namen eingeben.");
      return;
    }
    setBusy(true);
    try {
      await createNewHousehold(newWgName.trim());
      setNewWgName("");
      setCreateDialogVisible(false);
    } catch (error: any) {
      alert("WG konnte nicht erstellt werden: " + error?.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) {
      alert("Bitte Invite-Code eingeben.");
      return;
    }
    setBusy(true);
    try {
      await joinNewHousehold(inviteCode.trim());
      setInviteCode("");
      setJoinDialogVisible(false);
    } catch (error: any) {
      alert("WG konnte nicht gefunden werden: " + error?.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="headlineMedium">Profil</Text>
          <HouseholdDropdown />
        </View>

        {/* User Info */}
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

        {/* Meine WGs */}
        <Card>
          <Card.Title title="Meine WGs" subtitle={`${households.length} WG${households.length !== 1 ? "s" : ""}`} />
          <Card.Content>
            {households.map((h, index) => (
              <View key={h.id}>
                <List.Item
                  title={h.name}
                  description={`Invite-Code: ${h.inviteCode}`}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={h.id === household.id ? "home" : "home-outline"}
                    />
                  )}
                />
                {index < households.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* WG verwalten */}
        <Card>
          <Card.Title title="WG verwalten" />
          <Card.Content style={{ gap: 8 }}>
            <Button
              mode="outlined"
              icon="plus"
              onPress={() => setCreateDialogVisible(true)}
            >
              Neue WG erstellen
            </Button>
            <Button
              mode="outlined"
              icon="account-plus"
              onPress={() => setJoinDialogVisible(true)}
            >
              WG per Invite-Code beitreten
            </Button>
          </Card.Content>
        </Card>

        <Button mode="contained-tonal" onPress={logout}>
          Ausloggen
        </Button>
      </ScrollView>

      <Portal>
        {/* Create WG Dialog */}
        <Dialog
          visible={createDialogVisible}
          onDismiss={() => setCreateDialogVisible(false)}
        >
          <Dialog.Title>Neue WG erstellen</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="WG-Name"
              value={newWgName}
              onChangeText={setNewWgName}
              mode="outlined"
              placeholder="z.B. Sommer WG"
              style={{ marginTop: 8 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Abbrechen</Button>
            <Button onPress={handleCreate} loading={busy} disabled={busy}>
              Erstellen
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Join WG Dialog */}
        <Dialog
          visible={joinDialogVisible}
          onDismiss={() => setJoinDialogVisible(false)}
        >
          <Dialog.Title>WG beitreten</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Invite-Code"
              value={inviteCode}
              onChangeText={(v) => setInviteCode(v.toUpperCase())}
              mode="outlined"
              autoCapitalize="characters"
              placeholder="z.B. ABC123"
              style={{ marginTop: 8 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setJoinDialogVisible(false)}>Abbrechen</Button>
            <Button onPress={handleJoin} loading={busy} disabled={busy}>
              Beitreten
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}