import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { pb } from "../lib/pocketbase";

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    try {
      await pb.collection("users").authWithPassword(email, password);
      onLogin();
    } catch (error) {
      console.error(error);
      Alert.alert("Login fehlgeschlagen", "Bitte E-Mail und Passwort prüfen.");
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
        padding: 24,
        gap: 12,
      }}
    >
      <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>
        WG App Login
      </Text>

      <TextInput
        placeholder="E-Mail"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: "#999",
          color: "black",
          backgroundColor: "white",
          padding: 8,
        }}
      />

      <TextInput
        placeholder="Passwort"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: "#999",
          color: "black",
          backgroundColor: "white",
          padding: 8,
        }}
      />

      <Button title="Einloggen" onPress={login} />
    </View>
  );
}