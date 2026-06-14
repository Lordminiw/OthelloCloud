import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Divider, List, Text } from "react-native-paper";
import { layout } from "@/components/app-screen";
import type { ExpensesScreenViewModel } from "./use-expenses-screen";

export function SettlementListCard({ vm }: { vm: ExpensesScreenViewModel }) {
  return (
    <Card style={layout.card}>
      <Card.Title title={vm.t("expenses.settlementsTitle")} />
      <Card.Content style={layout.listCardContent}>
        {vm.settlements.length === 0 && (
          <Text variant="bodyMedium" style={styles.listEmptyText}>
            {vm.t("expenses.noSettlementsYet")}
          </Text>
        )}

        {vm.settlements.length > 0 && (
          <ScrollView nestedScrollEnabled style={!vm.isWide && styles.mobileCardList}>
            {vm.settlements.map((settlement) => (
              <View key={settlement.id}>
                <List.Item
                  title={`${vm.getMemberLabel(settlement.fromUser)} ${
                    vm.t("expenses.paidAction")
                  } ${settlement.amount.toFixed(2)} €`}
                  description={`${vm.t("expenses.toLabel")} ${vm.getMemberLabel(
                    settlement.toUser
                  )}`}
                  left={(props) => <List.Icon {...props} icon="bank-transfer" />}
                  right={() => (
                    <Button
                      mode="text"
                      onPress={() => void vm.deleteSettlementById(settlement.id)}
                    >
                      {vm.t("expenses.deleteButton")}
                    </Button>
                  )}
                />
                <Divider />
              </View>
            ))}
          </ScrollView>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  mobileCardList: {
    height: 240,
    overflow: "hidden",
  },
  listEmptyText: {
    paddingHorizontal: 16,
  },
});
