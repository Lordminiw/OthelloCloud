import { useEffect, useState } from "react";
import { Button, FlatList, Text, TextInput, View } from "react-native";
import { pb } from "../lib/pocketbase";

type ShoppingItem = {
  id: string;
  name: string;
  quantity?: string;
  checked: boolean;
};

const HOUSEHOLD_ID = "y6qkyd15kvxu7r8";

export function ShoppingListScreen() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [name, setName] = useState("");

  async function loadItems() {
    const records = await pb.collection("shopping_items").getFullList<ShoppingItem>({
      filter: `household = "${HOUSEHOLD_ID}"`,
      sort: "-created",
    });

    setItems(records);
  }

  async function addItem() {
    if (!name.trim()) return;

    await pb.collection("shopping_items").create({
      household: HOUSEHOLD_ID,
      name: name.trim(),
      checked: false,
    });

    setName("");
  }

  async function toggleItem(item: ShoppingItem) {
    await pb.collection("shopping_items").update(item.id, {
      checked: !item.checked,
    });
  }

  useEffect(() => {
    loadItems();

    pb.collection("shopping_items").subscribe("*", () => {
      loadItems();
    });

    return () => {
      pb.collection("shopping_items").unsubscribe("*");
    };
  }, []);

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
        Einkaufsliste
      </Text>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          placeholder="Neuer Artikel"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          style={{
            borderWidth: 1,
            borderColor: "#999",
            color: "black",
            backgroundColor: "white",
            padding: 8,
            flex: 1,
          }}
        />
        <Button title="+" onPress={addItem} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text
            onPress={() => toggleItem(item)}
            style={{
              color: "black",
              padding: 12,
              fontSize: 18,
              textDecorationLine: item.checked ? "line-through" : "none",
            }}
          >
            {item.checked ? "✅" : "⬜"} {item.name}
          </Text>
        )}
      />
    </View>
  );
}