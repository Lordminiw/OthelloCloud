import { Text, View } from "react-native";

export function ExpensesScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "white", padding: 24 }}>
      <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>
        Ausgaben
      </Text>
      <Text style={{ color: "black" }}>Kommt als nächstes.</Text>
    </View>
  );
}