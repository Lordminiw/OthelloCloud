import { useState } from "react";
import { View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import { pb } from "../lib/pocketbase";

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    try {
      await pb.collection("users").authWithPassword(email.trim(), password);
      onLogin();
    } catch (error: any) {
      console.log("LOGIN ERROR:", error);
      console.log("RESPONSE:", error?.response);

      alert(
        "Login fehlgeschlagen:\n\n" +
          "Status: " +
          error?.status +
          "\n" +
          "Message: " +
          error?.message +
          "\n" +
          "Response: " +
          JSON.stringify(error?.response, null, 2)
      );
    }
  }

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
        <Card.Title title="WG App Login" />
        <Card.Content style={{ gap: 12 }}>
          <Text variant="bodyMedium">
            Melde dich mit deinem WG-Account an.
          </Text>

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

          <Button mode="contained" onPress={login}>
            Einloggen
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}