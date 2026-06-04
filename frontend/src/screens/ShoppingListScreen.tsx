import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Button, Card, Divider, List, Text, TextInput } from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
import { HouseholdDropdown } from "@/components/household-dropdown";
import { useLanguage } from "@/context/language-context";
import { pb } from "../lib/pocketbase";

type ShoppingItem = {
  id: string;
  name: string;
  quantity?: string;
  checked: boolean;
  checkedAt?: string;
};

type ShoppingSuggestion = {
  name: string;
  quantity?: string;
};

type ShoppingListScreenProps = {
  householdId: string;
};

const MAX_CHECKED_ITEMS = 10;

export function ShoppingListScreen({ householdId }: ShoppingListScreenProps) {
  const { t, language } = useLanguage();
  const isGerman = language === "de";
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [openItems, setOpenItems] = useState<ShoppingItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<ShoppingItem[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  const suggestions = useMemo(() => {
    const query = name.trim().toLowerCase();

    if (!query) {
      return [];
    }

    const seen = new Set<string>();
    const combined = [...openItems, ...checkedItems];

    return combined.reduce<ShoppingSuggestion[]>((result, item) => {
      const normalizedName = item.name.trim();
      const normalizedKey = normalizedName.toLowerCase();

      if (!normalizedName || seen.has(normalizedKey)) {
        return result;
      }

      if (!normalizedKey.includes(query)) {
        return result;
      }

      seen.add(normalizedKey);
      result.push({
        name: normalizedName,
        quantity: item.quantity?.trim() || undefined,
      });
      return result;
    }, []).slice(0, 5);
  }, [name, openItems, checkedItems]);

  const loadItems = useCallback(async () => {
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
  }, [householdId]);

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

  function applySuggestion(suggestion: ShoppingSuggestion) {
    setName(suggestion.name);
    if (suggestion.quantity) {
      setQuantity(suggestion.quantity);
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

    void pb.collection("shopping_items").subscribe("*", async () => {
      await loadItems();
    });

    return () => {
      void pb.collection("shopping_items").unsubscribe("*");
    };
  }, [loadItems]);

  function itemDescription(item: ShoppingItem) {
    if (!item.quantity) {
      return undefined;
    }

    return isGerman ? `Menge: ${item.quantity}` : `Quantity: ${item.quantity}`;
  }

  return (
    <AppScreen
      title={t("shopping.title")}
      right={<HouseholdDropdown />}
      browserTitle={t("shopping.browserTitle")}
    >
      <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
          <Card style={[layout.card, isWide && layout.wideForm]}>
          <Card.Title title={t("shopping.newItemTitle")} />
          <Card.Content style={layout.formContent}>
            <TextInput
              label={t("shopping.itemLabel")}
              value={name}
              onChangeText={setName}
              mode="outlined"
            />

            {suggestions.length > 0 && (
              <View style={styles.suggestionsCard}>
                <Text variant="labelMedium" style={styles.suggestionsLabel}>
                  {isGerman ? "Vorschläge" : "Suggestions"}
                </Text>

                {suggestions.map((suggestion, index) => (
                  <View key={`${suggestion.name}-${index}`}>
                    <List.Item
                      title={suggestion.name}
                      description={
                        suggestion.quantity
                          ? isGerman
                            ? `Zuletzt: ${suggestion.quantity}`
                            : `Last used: ${suggestion.quantity}`
                          : isGerman
                            ? "Schon mal verwendet"
                            : "Used before"
                      }
                      left={(props) => <List.Icon {...props} icon="history" />}
                      onPress={() => applySuggestion(suggestion)}
                      style={styles.suggestionItem}
                    />
                    {index < suggestions.length - 1 && <Divider />}
                  </View>
                ))}
              </View>
            )}

            <TextInput
              label={isGerman ? "Menge" : "Quantity"}
              value={quantity}
              onChangeText={setQuantity}
              mode="outlined"
              placeholder={isGerman ? "z. B. 2x, 1 kg, 500 g" : "e.g. 2x, 1 kg, 500 g"}
            />

            <Button mode="contained" onPress={addItem}>
              {t("shopping.addButton")}
            </Button>
          </Card.Content>
        </Card>

        <View style={[layout.stack, isWide && layout.widePanel]}>
          <Card style={layout.card}>
            <Card.Title
              title={isGerman ? `Offen (${openItems.length})` : `Open (${openItems.length})`}
            />
            <Card.Content style={layout.listCardContent}>
              {openItems.length === 0 && (
                <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                  {t("common.noItems")}
                </Text>
              )}

              {openItems.length > 0 && (
                <ScrollView
                  nestedScrollEnabled
                  style={!isWide && styles.mobileCardList}
                >
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
                </ScrollView>
              )}
            </Card.Content>
          </Card>

          <Card style={layout.card}>
            <Card.Title title={`${t("shopping.completedSection")} (${checkedItems.length})`} />
            <Card.Content style={layout.listCardContent}>
              {checkedItems.length === 0 && (
                <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                  {t("common.noCompletedItems")}
                </Text>
              )}

              {checkedItems.length > 0 && (
                <ScrollView
                  nestedScrollEnabled
                  style={!isWide && styles.mobileCardList}
                >
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
                </ScrollView>
              )}
            </Card.Content>
          </Card>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  mobileCardList: {
    maxHeight: 360,
  },
  suggestionsCard: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(127, 127, 127, 0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127, 127, 127, 0.18)",
  },
  suggestionsLabel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    opacity: 0.8,
  },
  suggestionItem: {
    paddingLeft: 8,
  },
});
