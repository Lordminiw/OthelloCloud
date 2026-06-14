import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Divider, List, Text } from "react-native-paper";
import { layout } from "@/components/app-screen";
import type { ExpensesScreenViewModel } from "./use-expenses-screen";

export function ExpenseListCard({ vm }: { vm: ExpensesScreenViewModel }) {
  return (
    <View style={layout.stack}>
      <View style={[layout.sectionGrid, vm.isWide && layout.wideRow]}>
        <Card style={[layout.card, layout.twoColumnCard]}>
          <Card.Title title={vm.t("expenses.balancesTitle")} />
          <Card.Content style={layout.listCardContent}>
            {vm.balances.length === 0 && (
              <Text variant="bodyMedium" style={styles.listEmptyText}>
                {vm.t("expenses.everythingBalanced")}
              </Text>
            )}

            {vm.balances.length > 0 && (
              <ScrollView nestedScrollEnabled style={!vm.isWide && styles.mobileCardList}>
                {vm.balances.map((balance) => (
                  <List.Item
                    key={balance.userId}
                    title={vm.getMemberLabel(balance.userId)}
                    description={`${balance.amount.toFixed(2)} €`}
                    left={(props) => <List.Icon {...props} icon="account" />}
                  />
                ))}
              </ScrollView>
            )}
          </Card.Content>
        </Card>

        <Card style={[layout.card, layout.twoColumnCard]}>
          <Card.Title title={vm.t("expenses.paymentSuggestionsTitle")} />
          <Card.Content style={layout.listCardContent}>
            {vm.paymentSuggestions.length === 0 && (
              <Text variant="bodyMedium" style={styles.listEmptyText}>
                {vm.t("expenses.noOpenPayments")}
              </Text>
            )}

            {vm.paymentSuggestions.length > 0 && (
              <ScrollView
                nestedScrollEnabled
                style={!vm.isWide && styles.paymentSuggestionList}
              >
                {vm.paymentSuggestions.map((suggestion, index) => (
                  <View key={`${suggestion.fromUser}-${suggestion.toUser}-${index}`}>
                    <List.Item
                      title={`${vm.getMemberLabel(suggestion.fromUser)} ${
                        vm.t("expenses.paysLabel")
                      } ${suggestion.amount.toFixed(2)} €`}
                      description={`${vm.t("expenses.toLabel")} ${vm.getMemberLabel(
                        suggestion.toUser
                      )}`}
                      left={(props) => <List.Icon {...props} icon="cash-fast" />}
                      right={() => (
                        <Button
                          mode="text"
                          onPress={() => vm.openSettlementFromSuggestion(suggestion)}
                        >
                          {vm.t("expenses.paidAction")}
                        </Button>
                      )}
                    />
                    <Divider />
                  </View>
                ))}
              </ScrollView>
            )}

            <Button
              mode="outlined"
              onPress={() => vm.setSettlementDialogVisible(true)}
              style={styles.paymentManualButton}
            >
              {vm.t("expenses.addSettlementManuallyButton")}
            </Button>
          </Card.Content>
        </Card>
      </View>

      <View style={[layout.sectionGrid, vm.isWide && layout.wideRow]}>
        <Card style={[layout.card, layout.twoColumnCard]}>
          <Card.Title
            title={vm.t("expenses.lastExpensesTitle")}
            subtitle={vm.isLoadingRecurring ? vm.t("common.loading") : undefined}
          />
          <Card.Content style={layout.listCardContent}>
            {vm.expenses.length === 0 && (
              <Text variant="bodyMedium" style={styles.listEmptyText}>
                {vm.t("expenses.noExpensesYet")}
              </Text>
            )}

            {vm.expenses.length > 0 && (
              <ScrollView nestedScrollEnabled style={!vm.isWide && styles.mobileCardList}>
                {vm.expenses.map((expense) => (
                  <View key={expense.id}>
                    <List.Item
                      title={() => (
                        <View style={styles.expenseTitleRow}>
                          <Text variant="titleMedium" style={styles.expenseTitleText}>
                            {expense.description}: {expense.amount.toFixed(2)} €
                          </Text>
                          {expense.recurringExpense ? (
                            <Text variant="labelSmall" style={styles.generatedBadge}>
                              {vm.t("expenses.recurringGeneratedBadge")}
                            </Text>
                          ) : null}
                        </View>
                      )}
                      description={vm.getExpenseSplitDescription(expense)}
                      left={(props) => (
                        <List.Icon
                          {...props}
                          icon={expense.recurringExpense ? "autorenew" : "receipt"}
                        />
                      )}
                      right={() => (
                        <View>
                          <Button mode="text" onPress={() => vm.openEditExpense(expense)}>
                            {vm.t("expenses.editButton")}
                          </Button>
                          <Button
                            mode="text"
                            onPress={() => void vm.deleteExpenseById(expense.id)}
                          >
                            {vm.t("expenses.deleteButton")}
                          </Button>
                        </View>
                      )}
                    />
                    <Divider />
                  </View>
                ))}
              </ScrollView>
            )}
          </Card.Content>
        </Card>

        <Card style={[layout.card, layout.twoColumnCard]}>
          <Card.Title
            title={vm.t("expenses.recurringListTitle")}
            subtitle={vm.isLoadingRecurring ? vm.t("common.loading") : undefined}
          />
          <Card.Content style={layout.listCardContent}>
            {vm.didRecurringLoadFail && (
              <View style={styles.recurringStatusBlock}>
                <Text variant="bodyMedium">{vm.t("expenses.recurringLoadFailed")}</Text>
                <Button mode="outlined" onPress={() => void vm.reload()}>
                  {vm.t("expenses.recurringRetryButton")}
                </Button>
              </View>
            )}

            {!vm.didRecurringLoadFail && vm.recurringExpenses.length === 0 && (
              <Text variant="bodyMedium" style={styles.listEmptyText}>
                {vm.t("expenses.noRecurringYet")}
              </Text>
            )}

            {!vm.didRecurringLoadFail && vm.recurringExpenses.length > 0 && (
              <ScrollView nestedScrollEnabled style={!vm.isWide && styles.mobileCardList}>
                {vm.recurringExpenses.map((expense) => (
                  <View key={expense.id}>
                    <List.Item
                      title={`${expense.description}: ${expense.amount.toFixed(2)} €`}
                      description={vm.getRecurringDescription(expense)}
                      left={(props) => (
                        <List.Icon
                          {...props}
                          icon={expense.active ? "calendar-sync" : "calendar-remove"}
                        />
                      )}
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
  );
}

const styles = StyleSheet.create({
  mobileCardList: {
    height: 240,
    overflow: "hidden",
  },
  paymentSuggestionList: {
    height: 206,
    overflow: "hidden",
  },
  paymentManualButton: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  listEmptyText: {
    paddingHorizontal: 16,
  },
  expenseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    paddingRight: 8,
  },
  expenseTitleText: {
    flexShrink: 1,
  },
  generatedBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(37, 99, 235, 0.14)",
    color: "#1d4ed8",
    overflow: "hidden",
  },
  recurringStatusBlock: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
