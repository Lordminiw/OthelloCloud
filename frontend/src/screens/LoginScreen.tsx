import { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Button, Card, Text, TextInput, useTheme } from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
import { useLanguage } from "@/context/language-context";
import { pb } from "../lib/pocketbase";
import { brand } from "../theme/brand";

export function LoginScreen({
  onLogin,
}: {
  onLogin: () => Promise<void> | void;
}) {
  const { t } = useLanguage();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);

  async function login() {
    if (!email.trim()) {
      alert(t("auth.emailRequired"));
      return;
    }

    if (!password) {
      alert(t("auth.passwordRequired"));
      return;
    }

    setBusy(true);

    try {
      await pb.collection("users").authWithPassword(email.trim(), password);
      await onLogin();
    } catch (error: any) {
      console.log("LOGIN ERROR:", error);
      console.log("STATUS:", error?.status);
      console.log("MESSAGE:", error?.message);
      console.log("RESPONSE:", error?.response);

      alert(
        t("auth.loginFailed") +
          "\n\n" +
          "Status: " +
          error?.status +
          "\n" +
          "Message: " +
          error?.message
      );
    } finally {
      setBusy(false);
    }
  }

  async function register() {
    if (!name.trim()) {
      alert(t("auth.nameRequired"));
      return;
    }

    if (!email.trim()) {
      alert(t("auth.emailRequired"));
      return;
    }

    if (password.length < 8) {
      alert(t("auth.passwordTooShort"));
      return;
    }

    setBusy(true);

    try {
      await pb.collection("users").create({
        name: name.trim(),
        email: email.trim(),
        password,
        passwordConfirm: password,
        emailVisibility: true,
      });

      await pb.collection("users").authWithPassword(email.trim(), password);

      await onLogin();
    } catch (error: any) {
      console.log("REGISTER ERROR:", error);
      console.log("STATUS:", error?.status);
      console.log("MESSAGE:", error?.message);
      console.log("RESPONSE:", error?.response);

      alert(
        t("auth.registerFailed") +
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

  const isLogin = mode === "login";
  const isWide = width >= 860;
  const palette = theme.colors;

  return (
    <AppScreen
      title={t("app.brand")}
      centered
      maxWidth={980}
      showBrand={false}
      browserTitle="Othello-Cloud"
    >
      <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
        <Card
          style={[
            layout.card,
            styles.heroCard,
            isWide ? styles.heroCardWide : styles.heroCardStacked,
            {
              backgroundColor: theme.dark ? palette.surfaceVariant : brand.colors.surfaceVariant,
              borderColor: palette.outline,
            },
          ]}
        >
          <Card.Content style={styles.heroContent}>
            <View style={styles.heroEyebrowRow}>
              <Text
                variant="labelLarge"
                style={[styles.heroEyebrow, { color: palette.primary }]}
              >
                OthelloCloud
              </Text>
            </View>

            <View style={styles.heroCopy}>
              <Text
                variant={isWide ? "displaySmall" : "headlineLarge"}
                style={[styles.heroTitle, { color: palette.onSurface }]}
              >
                {isLogin ? t("auth.loginTitle") : t("auth.registerTitle")}
              </Text>
              <Text
                variant="bodyLarge"
                style={[styles.heroDescription, { color: palette.onSurfaceVariant }]}
              >
                {isLogin
                  ? t("auth.loginDescription")
                  : t("auth.registerDescription")}
              </Text>
            </View>

            <View style={styles.heroDetails}>
              <View
                style={[
                  styles.heroDetail,
                  { backgroundColor: theme.dark ? "rgba(247, 237, 229, 0.07)" : "rgba(255, 253, 252, 0.78)" },
                ]}
              >
                <Text
                  variant="titleMedium"
                  style={[styles.heroDetailTitle, { color: palette.onSurface }]}
                >
                  {t("app.brand")}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: palette.onSurfaceVariant }}
                >
                  {isLogin
                    ? t("auth.loginDescription")
                    : t("auth.registerDescription")}
                </Text>
              </View>
              <View
                style={[
                  styles.heroDetail,
                  { backgroundColor: theme.dark ? "rgba(247, 237, 229, 0.05)" : "rgba(184, 92, 56, 0.08)" },
                ]}
              >
                <Text
                  variant="titleMedium"
                  style={[styles.heroDetailTitle, { color: palette.onSurface }]}
                >
                  {isLogin ? t("auth.loginButton") : t("auth.registerButton")}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: palette.onSurfaceVariant }}
                >
                  {isLogin ? t("auth.loginToggle") : t("auth.registerToggle")}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card
          style={[
            layout.card,
            isWide && layout.wideForm,
            styles.formCard,
            {
              backgroundColor: theme.dark ? palette.surface : brand.colors.surface,
              borderColor: palette.outline,
            },
          ]}
        >
          <Card.Content style={[layout.formContent, styles.formContent]}>
            <View style={styles.formHeader}>
              <Text variant="headlineSmall" style={{ color: palette.onSurface }}>
                {isLogin ? t("auth.loginButton") : t("auth.registerButton")}
              </Text>
              <Text variant="bodyMedium" style={{ color: palette.onSurfaceVariant }}>
                {isLogin
                  ? t("auth.loginDescription")
                  : t("auth.registerDescription")}
              </Text>
            </View>

            {!isLogin && (
              <TextInput
                label={t("auth.nameLabel")}
                value={name}
                onChangeText={setName}
                mode="outlined"
                placeholder={t("auth.namePlaceholder")}
              />
            )}

            <TextInput
              label={t("auth.emailLabel")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              mode="outlined"
            />

            <TextInput
              label={t("auth.passwordLabel")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              mode="outlined"
            />

            <Button
              mode="contained"
              onPress={isLogin ? login : register}
              disabled={busy}
              loading={busy}
              contentStyle={styles.primaryButtonContent}
              style={styles.primaryButton}
            >
              {isLogin ? t("auth.loginButton") : t("auth.registerButton")}
            </Button>

            <View style={styles.secondaryActions}>
              <Button
                mode="text"
                onPress={() => {
                  setMode(isLogin ? "register" : "login");
                }}
                disabled={busy}
                compact
              >
                {isLogin ? t("auth.loginToggle") : t("auth.registerToggle")}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 30,
    overflow: "hidden",
  },
  heroCardWide: {
    minHeight: 480,
  },
  heroCardStacked: {
    minHeight: 0,
  },
  heroContent: {
    flex: 1,
    gap: 24,
    padding: 28,
    justifyContent: "space-between",
  },
  heroEyebrowRow: {
    alignItems: "flex-start",
  },
  heroEyebrow: {
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  heroCopy: {
    gap: 14,
    maxWidth: 460,
  },
  heroTitle: {
    lineHeight: 48,
  },
  heroDescription: {
    lineHeight: 26,
  },
  heroDetails: {
    gap: 12,
  },
  heroDetail: {
    borderRadius: 22,
    padding: 18,
    gap: 6,
  },
  heroDetailTitle: {
    fontWeight: "600",
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 28,
  },
  formContent: {
    padding: 24,
  },
  formHeader: {
    gap: 8,
    marginBottom: 6,
  },
  primaryButton: {
    marginTop: 4,
  },
  primaryButtonContent: {
    minHeight: 48,
  },
  secondaryActions: {
    alignItems: "center",
    gap: 2,
    paddingTop: 4,
  },
});
