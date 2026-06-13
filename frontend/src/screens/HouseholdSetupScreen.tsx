import { useEffect, useState } from "react";
import { Button, Card, Text, TextInput } from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
import { PageSection, SplitLayout } from "@/components/layout";
import { createHousehold, joinHousehold } from "../lib/household";
import { useLanguage } from "@/context/language-context";

function normalizeInviteCode(value?: string) {
  return (value ?? "").toUpperCase();
}

export function HouseholdSetupScreen({
  initialInviteCode,
  onHouseholdReady,
}: {
  initialInviteCode?: string;
  onHouseholdReady: () => void;
}) {
  const { t } = useLanguage();
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setInviteCode(normalizeInviteCode(initialInviteCode));
  }, [initialInviteCode]);

  async function handleCreateHousehold() {
    const normalizedHouseholdName = newHouseholdName.trim();

    if (!normalizedHouseholdName) {
      alert(t("setup.householdNameRequired"));
      return;
    }

    setBusy(true);

    try {
      await createHousehold(normalizedHouseholdName);
      onHouseholdReady();
    } catch (error: any) {
      console.log("CREATE HOUSEHOLD ERROR:", error);
      console.log("RESPONSE:", error?.response);

      alert(
        t("setup.createFailed") +
          "\n\n" +
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
    const normalizedInviteCode = normalizeInviteCode(inviteCode.trim());

    if (!normalizedInviteCode) {
      alert(t("setup.inviteCodeRequired"));
      return;
    }

    setBusy(true);
    setInviteCode(normalizedInviteCode);

    try {
      await joinHousehold(normalizedInviteCode);
      onHouseholdReady();
    } catch (error: any) {
      console.log("JOIN HOUSEHOLD ERROR:", error);
      console.log("RESPONSE:", error?.response);

      alert(
        t("setup.joinFailed") +
          "\n\n" +
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
    <AppScreen title={t("setup.title")} centered maxWidth={920}>
      <PageSection>
        <SplitLayout>
          <Card style={[layout.card, layout.twoColumnCard]}>
            <Card.Title title={t("setup.createHouseholdTitle")} />
            <Card.Content style={layout.formContent}>
              <Text variant="bodyMedium">{t("setup.createDescription")}</Text>

              <TextInput
                label={t("setup.householdNameLabel")}
                value={newHouseholdName}
                onChangeText={setNewHouseholdName}
                mode="outlined"
                placeholder={t("setup.householdNamePlaceholder")}
              />

              <Button
                mode="contained"
                onPress={handleCreateHousehold}
                disabled={busy}
                loading={busy}
              >
                {t("setup.createButton")}
              </Button>
            </Card.Content>
          </Card>

          <Card style={[layout.card, layout.twoColumnCard]}>
            <Card.Title title={t("setup.joinHouseholdTitle")} />
            <Card.Content style={layout.formContent}>
              <Text variant="bodyMedium">{t("setup.joinDescription")}</Text>

              <TextInput
                label={t("setup.inviteCodeLabel")}
                value={inviteCode}
                onChangeText={(value) => setInviteCode(normalizeInviteCode(value))}
                mode="outlined"
                autoCapitalize="characters"
                placeholder={t("setup.inviteCodePlaceholder")}
              />

              <Button
                mode="outlined"
                onPress={handleJoinHousehold}
                disabled={busy}
                loading={busy}
              >
                {t("setup.joinButton")}
              </Button>
            </Card.Content>
          </Card>
        </SplitLayout>
      </PageSection>
    </AppScreen>
  );
}
