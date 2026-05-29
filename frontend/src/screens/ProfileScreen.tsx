import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import {
  Button,
  Card,
  Dialog,
  Divider,
  List,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
import { Household } from "../lib/household";
import { pb } from "../lib/pocketbase";
import { useHousehold } from "@/context/household-context";
import { HouseholdDropdown } from "@/components/household-dropdown";
import {
  HouseholdMember,
  loadHouseholdMembers,
  removeHouseholdMember,
  updateHouseholdMemberRole,
} from "../lib/members";

type PendingMemberAction =
  | {
      type: "remove";
      member: HouseholdMember;
    }
  | {
      type: "promote";
      member: HouseholdMember;
    }
  | {
      type: "demote";
      member: HouseholdMember;
    }
  | {
      type: "leave";
      member: HouseholdMember;
    };

export function ProfileScreen({
  household,
  initialInviteCode,
  onLogout,
}: {
  household: Household;
  initialInviteCode?: string;
  onLogout: () => void;
}) {
  const user = pb.authStore.model;
  const { households, createNewHousehold, joinNewHousehold, refreshHouseholds } =
    useHousehold();

  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [joinDialogVisible, setJoinDialogVisible] = useState(false);
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [newWgName, setNewWgName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [newUserName, setNewUserName] = useState(user?.name ?? "");
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [inviteFeedbackId, setInviteFeedbackId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberBusyId, setMemberBusyId] = useState<string | null>(null);
  const [pendingMemberAction, setPendingMemberAction] =
    useState<PendingMemberAction | null>(null);

  const currentMembership = useMemo(
    () => members.find((member) => member.userId === user?.id) ?? null,
    [members, user?.id]
  );

  const canManageMembers = currentMembership?.role === "admin";

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const loadedMembers = await loadHouseholdMembers(household.id);
      setMembers(loadedMembers);
    } catch (error: any) {
      alert(
        "Mitglieder konnten nicht geladen werden: " + (error?.message ?? "Unbekannt")
      );
    } finally {
      setMembersLoading(false);
    }
  }, [household.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (initialInviteCode) {
      setInviteCode(initialInviteCode);
      setJoinDialogVisible(true);
    }
  }, [initialInviteCode]);

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

  async function handleRenameUser() {
    if (!user?.id) {
      alert("Du bist nicht eingeloggt.");
      return;
    }

    const trimmedName = newUserName.trim();
    if (!trimmedName) {
      alert("Bitte Namen eingeben.");
      return;
    }

    setBusy(true);
    try {
      const updatedUser = await pb.collection("users").update(user.id, {
        name: trimmedName,
      });
      pb.authStore.save(pb.authStore.token, updatedUser);
      setDisplayName(trimmedName);
      setRenameDialogVisible(false);
    } catch (error: any) {
      alert("Name konnte nicht geaendert werden: " + (error?.message ?? "Unbekannt"));
    } finally {
      setBusy(false);
    }
  }

  function getInviteLink(inviteCodeValue: string) {
    const code = inviteCodeValue.trim().toUpperCase();

    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/?invite=${encodeURIComponent(code)}`;
    }

    return `Invite-Code: ${code}`;
  }

  async function copyInviteLink(targetHousehold: Household) {
    const link = getInviteLink(targetHousehold.inviteCode);

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(link);
        setInviteFeedbackId(targetHousehold.id);
        window.setTimeout(() => setInviteFeedbackId(null), 1800);
        return;
      }

      if (typeof window !== "undefined" && window.prompt) {
        window.prompt("Invite-Link kopieren:", link);
        return;
      }

      alert(link);
    } catch {
      alert(link);
    }
  }

  function requestRemoveMember(member: HouseholdMember) {
    setPendingMemberAction({ type: "remove", member });
  }

  function requestPromoteMember(member: HouseholdMember) {
    setPendingMemberAction({ type: "promote", member });
  }

  function requestDemoteMember(member: HouseholdMember) {
    setPendingMemberAction({ type: "demote", member });
  }

  function requestLeaveHousehold(member: HouseholdMember) {
    setPendingMemberAction({ type: "leave", member });
  }

  async function confirmPendingMemberAction() {
    if (!pendingMemberAction) {
      return;
    }

    const { member, type } = pendingMemberAction;
    setMemberBusyId(member.id);

    try {
      if (type === "remove" || type === "leave") {
        await removeHouseholdMember(member.id);
      } else {
        await updateHouseholdMemberRole(
          member.id,
          type === "promote" ? "admin" : "member"
        );
      }

      await loadMembers();
      await refreshHouseholds();
    } catch (error: any) {
      alert("Mitglied konnte nicht aktualisiert werden: " + (error?.message ?? "Unbekannt"));
    } finally {
      setMemberBusyId(null);
      setPendingMemberAction(null);
    }
  }

  function getMemberLabel(member: HouseholdMember) {
    return member.name || member.email;
  }

  function getPendingMemberActionCopy(action: PendingMemberAction) {
    const label = getMemberLabel(action.member);

    if (action.type === "remove") {
      return {
        title: "Mitglied entfernen",
        message: `Willst du ${label} wirklich aus der WG entfernen?`,
        confirmLabel: "Entfernen",
      };
    }

    if (action.type === "promote") {
      return {
        title: "Zum Admin machen",
        message: `Willst du ${label} wirklich zum Admin machen?`,
        confirmLabel: "Machen",
      };
    }

    if (action.type === "demote") {
      return {
        title: "Admin-Rechte entziehen",
        message: `Willst du ${label} wirklich wieder zum Mitglied machen?`,
        confirmLabel: "Entziehen",
      };
    }

    return {
      title: "WG verlassen",
      message: "Willst du diese WG wirklich verlassen?",
      confirmLabel: "Verlassen",
    };
  }

  const pendingCopy = pendingMemberAction
    ? getPendingMemberActionCopy(pendingMemberAction)
    : null;

  return (
    <AppScreen
      title="Profil"
      right={<HouseholdDropdown />}
      browserTitle="OthelloCloud - Profil"
    >
      <View style={layout.stack}>
        <Card style={layout.card}>
          <Card.Title title={displayName || "Benutzer"} subtitle={user?.email} />
          <Card.Content style={layout.formContent}>
            <Button
              mode="outlined"
              icon="account-edit"
              onPress={() => {
                setNewUserName(displayName);
                setRenameDialogVisible(true);
              }}
            >
              Namen aendern
            </Button>
          </Card.Content>
        </Card>

        <Card style={layout.card}>
          <Card.Title
            title="Mitglieder"
            subtitle={
              membersLoading
                ? "Lade..."
                : `${members.length} Mitglied${members.length !== 1 ? "er" : ""}`
            }
          />
          <Card.Content style={layout.listCardContent}>
            {membersLoading && (
              <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                Mitglieder werden geladen...
              </Text>
            )}

            {!membersLoading && members.length === 0 && (
              <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                Noch keine Mitglieder gefunden.
              </Text>
            )}

            {!membersLoading &&
              members.map((member, index) => {
                const isCurrentUser = member.userId === user?.id;
                const isAdmin = member.role === "admin";

                return (
                  <View key={member.id}>
                    <List.Item
                      title={getMemberLabel(member)}
                      description={`${isAdmin ? "Admin" : "Mitglied"}${
                        isCurrentUser ? " - du" : ""
                      }`}
                      left={(props) => (
                        <List.Icon
                          {...props}
                          icon={isAdmin ? "account-star" : "account"}
                        />
                      )}
                      right={() => (
                        <View style={{ gap: 4, alignItems: "flex-end" }}>
                          {isCurrentUser ? (
                            <Button
                              mode="text"
                              onPress={() => requestLeaveHousehold(member)}
                              disabled={memberBusyId === member.id}
                            >
                              WG verlassen
                            </Button>
                          ) : canManageMembers ? (
                            <>
                              <Button
                                mode="text"
                                onPress={() =>
                                  isAdmin
                                    ? requestDemoteMember(member)
                                    : requestPromoteMember(member)
                                }
                                disabled={memberBusyId === member.id}
                              >
                                {isAdmin ? "Admin entfernen" : "Zum Admin"}
                              </Button>
                              <Button
                                mode="text"
                                onPress={() => requestRemoveMember(member)}
                                disabled={memberBusyId === member.id}
                              >
                                Entfernen
                              </Button>
                            </>
                          ) : null}
                        </View>
                      )}
                    />
                    {index < members.length - 1 && <Divider />}
                  </View>
                );
              })}
          </Card.Content>
        </Card>

        <Card style={layout.card}>
          <Card.Title title="Meine WGs" subtitle={`${households.length} WG${households.length !== 1 ? "s" : ""}`} />
          <Card.Content style={layout.listCardContent}>
            {households.map((h, index) => (
              <View key={h.id}>
                <List.Item
                  title={h.name}
                  description={
                    inviteFeedbackId === h.id
                      ? "Invite-Link kopiert"
                      : `Invite-Code: ${h.inviteCode}`
                  }
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={h.id === household.id ? "home" : "home-outline"}
                    />
                  )}
                  right={() => (
                    <Button
                      mode="text"
                      icon="link-variant"
                      compact
                      onPress={() => copyInviteLink(h)}
                    >
                      Invite
                    </Button>
                  )}
                />
                {index < households.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={layout.card}>
          <Card.Title title="WG verwalten" />
          <Card.Content style={layout.formContent}>
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
      </View>

      <Portal>
        <Dialog
          visible={renameDialogVisible}
          onDismiss={() => setRenameDialogVisible(false)}
        >
          <Dialog.Title>Namen aendern</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={newUserName}
              onChangeText={setNewUserName}
              mode="outlined"
              placeholder="z.B. Hannes"
              style={{ marginTop: 8 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameDialogVisible(false)}>Abbrechen</Button>
            <Button onPress={handleRenameUser} loading={busy} disabled={busy}>
              Speichern
            </Button>
          </Dialog.Actions>
        </Dialog>

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

        <Dialog
          visible={pendingMemberAction !== null}
          onDismiss={() => setPendingMemberAction(null)}
        >
          <Dialog.Title>{pendingCopy?.title ?? "Mitglied"}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{pendingCopy?.message}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPendingMemberAction(null)}>Abbrechen</Button>
            <Button onPress={confirmPendingMemberAction} loading={memberBusyId !== null}>
              {pendingCopy?.confirmLabel ?? "OK"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </AppScreen>
  );
}
