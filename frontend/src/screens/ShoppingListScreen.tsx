import { useEffect, useState } from "react";
import { Button, FlatList, Text, TextInput, View } from "react-native";
import { pb } from "../lib/pocketbase";

type ShoppingItem = {
  id: string;
  name: string;
  quantity?: string;
  checked: boolean;
  checkedAt?: string;
};

type ShoppingListScreenProps = {
  householdId: string;
};

const MAX_CHECKED_ITEMS = 10;

export function ShoppingListScreen({ householdId }: ShoppingListScreenProps) {
  const [openItems, setOpenItems] = useState<ShoppingItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<ShoppingItem[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  async function loadItems() {
    try {
      const records = await pb.collection("shopping_items").getFullList<ShoppingItem>({
        filter: `household = "${householdId}"`,
        sort: "checked,-checkedAt,-created",
      });

      const open = records.filter((item) => !item.checked);
      const checked = records.filter((item) => item.checked);

      setOpenItems(open);
      setCheckedItems(checked);
    } catch (error: any) {
      console.log("LOAD ITEMS ERROR:", error);
      console.log("RESPONSE:", error?.response);
      
    }
  }

  async function cleanupOldCheckedItems() {
    const checked = await pb.collection("shopping_items").getFullList<ShoppingItem>({
      filter: `household = "${householdId}" && checked = true`,
      sort: "-checkedAt",
    });

    const itemsToDelete = checked.slice(MAX_CHECKED_ITEMS);

    for (const item of itemsToDelete) {
      await pb.collection("shopping_items").delete(item.id);
    }
  }

  async function addItem() {
    if (!name.trim()) return;

    try {
      await pb.collection("shopping_items").create({
        household: householdId,
        name: name.trim(),
        quantity: quantity.trim(),
        checked: false,
        checkedAt: null,
        addedBy: pb.authStore.model?.id,
      });

      setName("");
      setQuantity("");
      await loadItems();
    } catch (error: any) {
      console.log("ADD ITEM ERROR:", error);
      console.log("RESPONSE:", error?.response);
    }
  }

  async function toggleItem(item: ShoppingItem) {
    try {
      const willBeChecked = !item.checked;

      await pb.collection("shopping_items").update(item.id, {
        checked: willBeChecked,
        checkedAt: willBeChecked ? new Date().toISOString() : "",
        checkedBy: willBeChecked ? pb.authStore.model?.id : "",
      });

      if (willBeChecked) {
        await cleanupOldCheckedItems();
      }

      await loadItems();
    } catch (error: any) {
      console.log("TOGGLE ITEM ERROR:", error);
      console.log("RESPONSE:", error?.response);

      alert("Item konnte nicht aktualisiert werden.\n\n" + JSON.stringify(error?.response, null, 2));
    }
  }

  useEffect(() => {
    loadItems();

    pb.collection("shopping_items").subscribe("*", async () => {
      await loadItems();
    });

    return () => {
      pb.collection("shopping_items").unsubscribe("*");
    };
  }, [householdId]);

  function renderItem({ item }: { item: ShoppingItem }) {
    return (
      <View
        style={{
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#ddd",
        }}
      >
        <Text
          onPress={() => toggleItem(item)}
          style={{
            color: item.checked ? "#777" : "black",
            fontSize: 18,
            textDecorationLine: item.checked ? "line-through" : "none",
          }}
        >
          {item.checked ? "✅" : "⬜"} {item.name}
          {item.quantity ? ` (${item.quantity})` : ""}
        </Text>
      </View>
    );
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

      <View style={{ flex: 1 }}>
        <Text style={{ color: "black", fontSize: 20, fontWeight: "bold" }}>Offen</Text>

        <FlatList
          data={openItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{ color: "#777", paddingTop: 12 }}>Keine offenen Einträge.</Text>}
        />
      </View>

      <View
        style={{
          flex: 1,
          borderTopWidth: 2,
          borderTopColor: "#ccc",
          paddingTop: 12,
        }}
      >
        <Text style={{ color: "black", fontSize: 20, fontWeight: "bold" }}>Zuletzt erledigt</Text>

        <FlatList
          data={checkedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{ color: "#777", paddingTop: 12 }}>Noch nichts erledigt.</Text>}
        />
      </View>
    </View>
  );
}
