import { Text, View } from "react-native";

export function CalendarScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "white", padding: 24 }}>
      <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>
        Kalender
      </Text>
      <Text style={{ color: "black" }}>Kommt später.</Text>
    </View>
  );
}