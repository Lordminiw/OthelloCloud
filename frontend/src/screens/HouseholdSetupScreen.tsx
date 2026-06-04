import { useEffect, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
import { createHousehold, joinHousehold } from "../lib/household";
import { useLanguage } from "@/context/language-context";

export function HouseholdSetupScreen({
  initialInviteCode,
  onHouseholdReady,
}: {
  initialInviteCode?: string;
  onHouseholdReady: () => void;
}) {
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const isWide = width >= 820;
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialInviteCode) {
      setInviteCode(initialInviteCode);
    }
  }, [initialInviteCode]);

  async function handleCreateHousehold() {
    if (!newHouseholdName.trim()) {
      alert(t("setup.householdNameRequired"));
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
    if (!inviteCode.trim()) {
      alert(t("setup.inviteCodeRequired"));
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
    <AppScreen title={t("setup.title")} centered>
      <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
      <Card style={[layout.card, layout.twoColumnCard]}>
        <Card.Title title={t("setup.createHouseholdTitle")} />
        <Card.Content style={layout.formContent}>
          <Text variant="bodyMedium">
            {t("setup.createDescription")}
          </Text>

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
          <Text variant="bodyMedium">
            {t("setup.joinDescription")}
          </Text>

          <TextInput
            label={t("setup.inviteCodeLabel")}
            value={inviteCode}
            onChangeText={(value) => setInviteCode(value.toUpperCase())}
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
      </View>
    </AppScreen>
  );
}
