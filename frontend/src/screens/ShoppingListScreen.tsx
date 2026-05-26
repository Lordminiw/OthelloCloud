import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Card, Divider, List, Text, TextInput, useTheme } from "react-native-paper";
import { pb } from "../lib/pocketbase";
import { HouseholdDropdown } from "@/components/household-dropdown";

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
  const theme = useTheme();
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

      setOpenItems(records.filter((item) => !item.checked));
      setCheckedItems(records.filter((item) => item.checked));
    } catch (error: any) {
      console.log("LOAD ITEMS ERROR FULL:", error);
      console.log("STATUS:", error?.status);
      console.log("MESSAGE:", error?.message);
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
        checkedAt: "",
        addedBy: pb.authStore.model?.id,
      });

      setName("");
      setQuantity("");
      await loadItems();
    } catch (error: any) {
      console.log("ADD ITEM ERROR:", error);
      console.log("RESPONSE:", error?.response);
      alert(JSON.stringify(error?.response, null, 2));
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
      alert(JSON.stringify(error?.response, null, 2));
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

  function itemDescription(item: ShoppingItem) {
    return item.quantity ? `Menge: ${item.quantity}` : undefined;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="headlineMedium">Einkaufsliste</Text>
          <HouseholdDropdown />
        </View>

        <Card>
          <Card.Title title="Neuer Artikel" />
          <Card.Content style={{ gap: 12 }}>
            <TextInput label="Artikel" value={name} onChangeText={setName} mode="outlined" />

            <TextInput label="Menge" value={quantity} onChangeText={setQuantity} mode="outlined" placeholder="z.B. 2x, 1 kg, 500 g" />

            <Button mode="contained" onPress={addItem}>
              Hinzufügen
            </Button>
          </Card.Content>
        </Card>

        <Card>
          <Card.Title title={`Offen (${openItems.length})`} />
          <Card.Content>
            {openItems.length === 0 && <Text variant="bodyMedium">Keine offenen Einträge.</Text>}

            {openItems.map((item) => (
              <View key={item.id}>
                <List.Item
                  title={item.name}
                  description={itemDescription(item)}
                  left={(props) => <List.Icon {...props} icon="checkbox-blank-outline" />}
                  onPress={() => toggleItem(item)}
                />
                <Divider />
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card>
          <Card.Title title={`Zuletzt erledigt (${checkedItems.length})`} />
          <Card.Content>
            {checkedItems.length === 0 && <Text variant="bodyMedium">Noch nichts erledigt.</Text>}

            {checkedItems.map((item) => (
              <View key={item.id}>
                <List.Item
                  title={item.name}
                  description={itemDescription(item)}
                  titleStyle={{ textDecorationLine: "line-through" }}
                  left={(props) => <List.Icon {...props} icon="checkbox-marked" />}
                  onPress={() => toggleItem(item)}
                />
                <Divider />
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}
