import { useState } from "react";
import { View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import { pb } from "../lib/pocketbase";

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);

  async function login() {
    if (!email.trim()) {
      alert("Bitte E-Mail eingeben.");
      return;
    }

    if (!password) {
      alert("Bitte Passwort eingeben.");
      return;
    }

    setBusy(true);

    try {
      await pb.collection("users").authWithPassword(email.trim(), password);
      onLogin();
    } catch (error: any) {
      console.log("LOGIN ERROR:", error);
      console.log("STATUS:", error?.status);
      console.log("MESSAGE:", error?.message);
      console.log("RESPONSE:", error?.response);

      alert(
        "Login fehlgeschlagen.\n\n" +
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
      alert("Bitte Namen eingeben.");
      return;
    }

    if (!email.trim()) {
      alert("Bitte E-Mail eingeben.");
      return;
    }

    if (password.length < 8) {
      alert("Bitte ein Passwort mit mindestens 8 Zeichen eingeben.");
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

      onLogin();
    } catch (error: any) {
      console.log("REGISTER ERROR:", error);
      console.log("STATUS:", error?.status);
      console.log("MESSAGE:", error?.message);
      console.log("RESPONSE:", error?.response);

      alert(
        "Registrierung fehlgeschlagen.\n\n" +
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

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f6f6f6",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <Card>
        <Card.Title title={isLogin ? "Einloggen" : "Registrieren"} />

        <Card.Content style={{ gap: 12 }}>
          <Text variant="bodyMedium">
            {isLogin
              ? "Melde dich mit deinem WG-Account an."
              : "Erstelle einen neuen Account. Danach kannst du eine WG erstellen oder per Invite-Code beitreten."}
          </Text>

          {!isLogin && (
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              placeholder="z.B. Hannes"
            />
          )}

          <TextInput
            label="E-Mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
          />

          <TextInput
            label="Passwort"
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
            {isLogin ? "Einloggen" : "Account erstellen"}
          </Button>

          <Button
            mode="text"
            onPress={() => {
              setMode(isLogin ? "register" : "login");
            }}
            disabled={busy}
          >
            {isLogin
              ? "Noch keinen Account? Registrieren"
              : "Schon einen Account? Einloggen"}
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}