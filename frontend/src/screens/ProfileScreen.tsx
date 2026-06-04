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
import { useLanguage } from "@/context/language-context";
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
  const { language } = useLanguage();
  const isGerman = language === "de";
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
        `${isGerman ? "Mitglieder konnten nicht geladen werden" : "Members could not be loaded"}: ${
          error?.message ?? (isGerman ? "Unbekannt" : "Unknown")
        }`
      );
    } finally {
      setMembersLoading(false);
    }
  }, [household.id, isGerman]);

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
      alert(isGerman ? "Bitte WG-Namen eingeben." : "Please enter a household name.");
      return;
    }

    setBusy(true);
    try {
      await createNewHousehold(newWgName.trim());
      setNewWgName("");
      setCreateDialogVisible(false);
    } catch (error: any) {
      alert(
        `${isGerman ? "WG konnte nicht erstellt werden" : "Household could not be created"}: ${
          error?.message ?? (isGerman ? "Unbekannt" : "Unknown")
        }`
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) {
      alert(isGerman ? "Bitte Invite-Code eingeben." : "Please enter an invite code.");
      return;
    }

    setBusy(true);
    try {
      await joinNewHousehold(inviteCode.trim());
      setInviteCode("");
      setJoinDialogVisible(false);
    } catch (error: any) {
      alert(
        `${isGerman ? "WG konnte nicht gefunden werden" : "Household could not be found"}: ${
          error?.message ?? (isGerman ? "Unbekannt" : "Unknown")
        }`
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRenameUser() {
    if (!user?.id) {
      alert(isGerman ? "Du bist nicht eingeloggt." : "You are not logged in.");
      return;
    }

    const trimmedName = newUserName.trim();
    if (!trimmedName) {
      alert(isGerman ? "Bitte Namen eingeben." : "Please enter a name.");
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
      alert(
        `${isGerman ? "Name konnte nicht geändert werden" : "Name could not be changed"}: ${
          error?.message ?? (isGerman ? "Unbekannt" : "Unknown")
        }`
      );
    } finally {
      setBusy(false);
    }
  }

  function getInviteLink(inviteCodeValue: string) {
    const code = inviteCodeValue.trim().toUpperCase();

    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/?invite=${encodeURIComponent(code)}`;
    }

    return `${isGerman ? "Invite-Code" : "Invite code"}: ${code}`;
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
        window.prompt(isGerman ? "Invite-Link kopieren:" : "Copy invite link:", link);
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
      alert(
        `${isGerman ? "Mitglied konnte nicht aktualisiert werden" : "Member could not be updated"}: ${
          error?.message ?? (isGerman ? "Unbekannt" : "Unknown")
        }`
      );
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
        title: isGerman ? "Mitglied entfernen" : "Remove member",
        message: isGerman
          ? `Willst du ${label} wirklich aus der WG entfernen?`
          : `Do you really want to remove ${label} from the household?`,
        confirmLabel: isGerman ? "Entfernen" : "Remove",
      };
    }

    if (action.type === "promote") {
      return {
        title: isGerman ? "Zum Admin machen" : "Promote to admin",
        message: isGerman
          ? `Willst du ${label} wirklich zum Admin machen?`
          : `Do you really want to promote ${label} to admin?`,
        confirmLabel: isGerman ? "Machen" : "Promote",
      };
    }

    if (action.type === "demote") {
      return {
        title: isGerman ? "Admin-Rechte entziehen" : "Remove admin role",
        message: isGerman
          ? `Willst du ${label} wirklich wieder zum Mitglied machen?`
          : `Do you really want to make ${label} a regular member again?`,
        confirmLabel: isGerman ? "Entziehen" : "Demote",
      };
    }

    return {
      title: isGerman ? "WG verlassen" : "Leave household",
      message: isGerman
        ? "Willst du diese WG wirklich verlassen?"
        : "Do you really want to leave this household?",
      confirmLabel: isGerman ? "Verlassen" : "Leave",
    };
  }

  const pendingCopy = pendingMemberAction
    ? getPendingMemberActionCopy(pendingMemberAction)
    : null;

  return (
    <AppScreen
      title={isGerman ? "Profil" : "Profile"}
      right={<HouseholdDropdown />}
      browserTitle={isGerman ? "OthelloCloud - Profil" : "OthelloCloud - Profile"}
    >
      <View style={layout.stack}>
        <Card style={layout.card}>
          <Card.Title title={displayName || (isGerman ? "Benutzer" : "User")} subtitle={user?.email} />
          <Card.Content style={layout.formContent}>
            <Button
              mode="outlined"
              icon="account-edit"
              onPress={() => {
                setNewUserName(displayName);
                setRenameDialogVisible(true);
              }}
            >
              {isGerman ? "Namen ändern" : "Change name"}
            </Button>
          </Card.Content>
        </Card>

        <Card style={layout.card}>
          <Card.Title
            title={isGerman ? "Mitglieder" : "Members"}
            subtitle={
              membersLoading
                ? (isGerman ? "Lade..." : "Loading...")
                : `${members.length} ${isGerman ? "Mitglied" : "member"}${members.length !== 1 ? (isGerman ? "er" : "s") : ""}`
            }
          />
          <Card.Content style={layout.listCardContent}>
            {membersLoading && (
              <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                {isGerman ? "Mitglieder werden geladen..." : "Members are loading..."}
              </Text>
            )}

            {!membersLoading && members.length === 0 && (
              <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                {isGerman ? "Noch keine Mitglieder gefunden." : "No members found yet."}
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
                      description={`${isAdmin ? (isGerman ? "Admin" : "Admin") : (isGerman ? "Mitglied" : "Member")}${
                        isCurrentUser ? (isGerman ? " - du" : " - you") : ""
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
                              {isGerman ? "WG verlassen" : "Leave household"}
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
                                {isAdmin ? (isGerman ? "Admin entfernen" : "Demote admin") : (isGerman ? "Zum Admin" : "Promote")}
                              </Button>
                              <Button
                                mode="text"
                                onPress={() => requestRemoveMember(member)}
                                disabled={memberBusyId === member.id}
                              >
                                {isGerman ? "Entfernen" : "Remove"}
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
          <Card.Title
            title={isGerman ? "Meine WGs" : "My households"}
            subtitle={`${households.length} ${isGerman ? "WG" : "household"}${households.length !== 1 ? (isGerman ? "s" : "s") : ""}`}
          />
          <Card.Content style={layout.listCardContent}>
            {households.map((h, index) => (
              <View key={h.id}>
                <List.Item
                  title={h.name}
                  description={
                    inviteFeedbackId === h.id
                      ? (isGerman ? "Invite-Link kopiert" : "Invite link copied")
                      : `${isGerman ? "Invite-Code" : "Invite code"}: ${h.inviteCode}`
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
                      {isGerman ? "Invite" : "Invite"}
                    </Button>
                  )}
                />
                {index < households.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={layout.card}>
          <Card.Title title={isGerman ? "WG verwalten" : "Manage household"} />
          <Card.Content style={layout.formContent}>
            <Button
              mode="outlined"
              icon="plus"
              onPress={() => setCreateDialogVisible(true)}
            >
              {isGerman ? "Neue WG erstellen" : "Create household"}
            </Button>
            <Button
              mode="outlined"
              icon="account-plus"
              onPress={() => setJoinDialogVisible(true)}
            >
              {isGerman ? "WG per Invite-Code beitreten" : "Join via invite code"}
            </Button>
          </Card.Content>
        </Card>

        <Button mode="contained-tonal" onPress={logout}>
          {isGerman ? "Ausloggen" : "Log out"}
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={renameDialogVisible}
          onDismiss={() => setRenameDialogVisible(false)}
        >
          <Dialog.Title>{isGerman ? "Namen ändern" : "Change name"}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={isGerman ? "Name" : "Name"}
              value={newUserName}
              onChangeText={setNewUserName}
              mode="outlined"
              placeholder={isGerman ? "z. B. Hannes" : "e.g. Hannes"}
              style={{ marginTop: 8 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameDialogVisible(false)}>{isGerman ? "Abbrechen" : "Cancel"}</Button>
            <Button onPress={handleRenameUser} loading={busy} disabled={busy}>
              {isGerman ? "Speichern" : "Save"}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={createDialogVisible}
          onDismiss={() => setCreateDialogVisible(false)}
        >
          <Dialog.Title>{isGerman ? "Neue WG erstellen" : "Create household"}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={isGerman ? "WG-Name" : "Household name"}
              value={newWgName}
              onChangeText={setNewWgName}
              mode="outlined"
              placeholder={isGerman ? "z. B. Sommer WG" : "e.g. Summer House"}
              style={{ marginTop: 8 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>{isGerman ? "Abbrechen" : "Cancel"}</Button>
            <Button onPress={handleCreate} loading={busy} disabled={busy}>
              {isGerman ? "Erstellen" : "Create"}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={joinDialogVisible}
          onDismiss={() => setJoinDialogVisible(false)}
        >
          <Dialog.Title>{isGerman ? "WG beitreten" : "Join household"}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={isGerman ? "Invite-Code" : "Invite code"}
              value={inviteCode}
              onChangeText={(v) => setInviteCode(v.toUpperCase())}
              mode="outlined"
              autoCapitalize="characters"
              placeholder={isGerman ? "z. B. ABC123" : "e.g. ABC123"}
              style={{ marginTop: 8 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setJoinDialogVisible(false)}>{isGerman ? "Abbrechen" : "Cancel"}</Button>
            <Button onPress={handleJoin} loading={busy} disabled={busy}>
              {isGerman ? "Beitreten" : "Join"}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={pendingMemberAction !== null}
          onDismiss={() => setPendingMemberAction(null)}
        >
          <Dialog.Title>{pendingCopy?.title ?? (isGerman ? "Mitglied" : "Member")}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{pendingCopy?.message}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPendingMemberAction(null)}>{isGerman ? "Abbrechen" : "Cancel"}</Button>
            <Button onPress={confirmPendingMemberAction} loading={memberBusyId !== null}>
              {pendingCopy?.confirmLabel ?? "OK"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </AppScreen>
  );
}
