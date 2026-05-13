import { useEffect, useState } from "react";
import { Button, FlatList, Text, TextInput, View } from "react-native";
import { pb } from "../lib/pocketbase";

type ShoppingItem = {
  id: string;
  name: string;
  quantity?: string;
  checked: boolean;
};

const householdId = "y6qkyd15kvxu7r8";

export function ShoppingListScreen({ householdId }: { householdId: string }) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  async function loadItems() {
    const records = await pb.collection("shopping_items").getFullList<ShoppingItem>({
      filter: `household = "${householdId}"`,
      sort: "checked,-created",
    });

    setItems(records);
  }

  async function addItem() {
    if (!name.trim()) return;

    await pb.collection("shopping_items").create({
      household: householdId,
      name: name.trim(),
      quantity: quantity.trim(),
      checked: false,
      addedBy: pb.authStore.model?.id,
    });

    setName("");
    setQuantity("");
  }

  async function deleteItem(item: ShoppingItem) {
    try {
      await pb.collection("shopping_items").delete(item.id);
    } catch (error: any) {
      console.log("DELETE ITEM ERROR:", error);
      alert(JSON.stringify(error?.response, null, 2));
    }
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
      <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>Einkaufsliste</Text>

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
        <TextInput
          placeholder="Menge"
          placeholderTextColor="#666"
          value={quantity}
          onChangeText={setQuantity}
          style={{
            borderWidth: 1,
            borderColor: "#999",
            color: "black",
            backgroundColor: "white",
            padding: 8,
            width: 90,
          }}
        />
        <Button title="+" onPress={addItem} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 12,
            }}
          >
            <Text
              onPress={() => toggleItem(item)}
              style={{
                color: "black",
                fontSize: 18,
                textDecorationLine: item.checked ? "line-through" : "none",
              }}
            >
              {item.checked ? "✅" : "⬜"} {item.name}
              {item.quantity ? ` (${item.quantity})` : ""}
            </Text>

            <Button title="Löschen" onPress={() => deleteItem(item)} />
          </View>
        )}
        F
      />
    </View>
  );
}
