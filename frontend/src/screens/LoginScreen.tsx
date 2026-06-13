import { useState } from "react";
import { Button, Card, Text, TextInput } from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
import { pb } from "../lib/pocketbase";
import { useLanguage } from "@/context/language-context";

export function LoginScreen({
  onLogin,
}: {
  onLogin: () => Promise<void> | void;
}) {
  const { t } = useLanguage();
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
  const title = isLogin ? t("auth.loginTitle") : t("auth.registerTitle");
  const subtitle = isLogin
    ? t("auth.loginDescription")
    : t("auth.registerDescription");

  return (
    <AppScreen
      title={title}
      subtitle={subtitle}
      centered
      maxWidth={460}
      browserTitle="Othello-Cloud"
    >
      <Card style={layout.card}>
        <Card.Content style={layout.formContent}>
          <Text variant="bodyMedium">{t("app.brand")}</Text>

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
          >
            {isLogin ? t("auth.loginButton") : t("auth.registerButton")}
          </Button>

          <Button
            mode="text"
            onPress={() => {
              setMode(isLogin ? "register" : "login");
            }}
            disabled={busy}
          >
            {isLogin ? t("auth.loginToggle") : t("auth.registerToggle")}
          </Button>
        </Card.Content>
      </Card>
    </AppScreen>
  );
}
