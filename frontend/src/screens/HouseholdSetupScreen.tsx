import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Button, Card, Text, TextInput, useTheme } from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
import { brand } from "@/src/theme/brand";
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
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 820;
  const palette = theme.colors;
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
    <AppScreen title={t("setup.title")} centered maxWidth={980}>
      <View style={layout.stack}>
        <Card
          style={[
            layout.card,
            styles.introCard,
            {
              backgroundColor: theme.dark ? palette.surfaceVariant : brand.colors.surfaceVariant,
              borderColor: palette.outline,
            },
          ]}
        >
          <Card.Content style={styles.introContent}>
            <View style={styles.introCopy}>
              <Text
                variant="labelLarge"
                style={[styles.introEyebrow, { color: palette.primary }]}
              >
                {t("app.brand")}
              </Text>
              <Text
                variant={isWide ? "headlineMedium" : "headlineSmall"}
                style={{ color: palette.onSurface }}
              >
                {t("setup.title")}
              </Text>
              <Text variant="bodyLarge" style={{ color: palette.onSurfaceVariant }}>
                {t("setup.createDescription")}
              </Text>
            </View>

            <View
              style={[
                styles.introHighlights,
                isWide && styles.introHighlightsWide,
              ]}
            >
              <View
                style={[
                  styles.introHighlight,
                  {
                    backgroundColor: theme.dark ? "rgba(247, 237, 229, 0.06)" : "rgba(255, 253, 252, 0.72)",
                  },
                ]}
              >
                <Text variant="titleMedium" style={{ color: palette.onSurface }}>
                  {t("setup.createHouseholdTitle")}
                </Text>
                <Text variant="bodyMedium" style={{ color: palette.onSurfaceVariant }}>
                  {t("setup.createDescription")}
                </Text>
              </View>

              <View
                style={[
                  styles.introHighlight,
                  {
                    backgroundColor: theme.dark ? "rgba(247, 237, 229, 0.04)" : "rgba(184, 92, 56, 0.08)",
                  },
                ]}
              >
                <Text variant="titleMedium" style={{ color: palette.onSurface }}>
                  {t("setup.joinHouseholdTitle")}
                </Text>
                <Text variant="bodyMedium" style={{ color: palette.onSurfaceVariant }}>
                  {t("setup.joinDescription")}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
          <Card
            style={[
              layout.card,
              layout.twoColumnCard,
              styles.pathCard,
              {
                backgroundColor: theme.dark ? palette.surface : brand.colors.surface,
                borderColor: palette.outline,
              },
            ]}
          >
            <Card.Content style={[layout.formContent, styles.pathContent]}>
              <View style={styles.pathHeader}>
                <Text
                  variant="labelLarge"
                  style={[styles.pathEyebrow, { color: palette.primary }]}
                >
                  {t("setup.createHouseholdTitle")}
                </Text>
                <Text variant="headlineSmall" style={{ color: palette.onSurface }}>
                  {t("setup.createButton")}
                </Text>
                <Text variant="bodyMedium" style={{ color: palette.onSurfaceVariant }}>
                  {t("setup.createDescription")}
                </Text>
              </View>

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
                contentStyle={styles.primaryButtonContent}
                style={styles.primaryButton}
              >
                {t("setup.createButton")}
              </Button>
            </Card.Content>
          </Card>

          <Card
            style={[
              layout.card,
              layout.twoColumnCard,
              styles.pathCard,
              {
                backgroundColor: theme.dark ? palette.surface : brand.colors.backgroundMuted,
                borderColor: palette.outline,
              },
            ]}
          >
            <Card.Content style={[layout.formContent, styles.pathContent]}>
              <View style={styles.pathHeader}>
                <Text
                  variant="labelLarge"
                  style={[styles.pathEyebrow, { color: palette.secondary }]}
                >
                  {t("setup.joinHouseholdTitle")}
                </Text>
                <Text variant="headlineSmall" style={{ color: palette.onSurface }}>
                  {t("setup.joinButton")}
                </Text>
                <Text variant="bodyMedium" style={{ color: palette.onSurfaceVariant }}>
                  {t("setup.joinDescription")}
                </Text>
              </View>

              <TextInput
                label={t("setup.inviteCodeLabel")}
                value={inviteCode}
                onChangeText={(value) => setInviteCode(value.toUpperCase())}
                mode="outlined"
                autoCapitalize="characters"
                placeholder={t("setup.inviteCodePlaceholder")}
              />

              <Button
                mode="contained-tonal"
                onPress={handleJoinHousehold}
                disabled={busy}
                loading={busy}
                contentStyle={styles.primaryButtonContent}
                style={styles.primaryButton}
              >
                {t("setup.joinButton")}
              </Button>
            </Card.Content>
          </Card>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  introCard: {
    borderWidth: 1,
    borderRadius: 30,
    overflow: "hidden",
  },
  introContent: {
    gap: 20,
    padding: 24,
  },
  introCopy: {
    gap: 10,
  },
  introEyebrow: {
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  introHighlights: {
    gap: 12,
  },
  introHighlightsWide: {
    flexDirection: "row",
  },
  introHighlight: {
    flex: 1,
    minWidth: 0,
    borderRadius: 22,
    padding: 18,
    gap: 6,
  },
  pathCard: {
    borderWidth: 1,
    borderRadius: 28,
  },
  pathContent: {
    padding: 24,
  },
  pathHeader: {
    gap: 8,
    marginBottom: 4,
  },
  pathEyebrow: {
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  primaryButton: {
    marginTop: 4,
  },
  primaryButtonContent: {
    minHeight: 48,
  },
});
