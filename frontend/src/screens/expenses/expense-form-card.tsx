import { StyleSheet, View } from "react-native";
import { Button, Card, Checkbox, SegmentedButtons, Text, TextInput } from "react-native-paper";
import { layout } from "@/components/app-screen";
import { SplitMode } from "../../lib/expenses";
import { RecurringIntervalUnit } from "../../lib/recurring-expenses";
import type { ExpensesScreenViewModel } from "./use-expenses-screen";

export function ExpenseFormCard({ vm }: { vm: ExpensesScreenViewModel }) {
  return (
    <Card style={layout.card}>
      <Card.Title title={vm.t("expenses.newExpenseTitle")} />
      <Card.Content style={layout.formContent}>
        <TextInput
          label={vm.t("expenses.descriptionLabel")}
          testID="expense-description-input"
          value={vm.description}
          onChangeText={vm.setDescription}
          mode="outlined"
        />

        <TextInput
          label={vm.t("expenses.amountLabel")}
          testID="expense-amount-input"
          value={vm.amountText}
          onChangeText={vm.setAmountText}
          keyboardType="decimal-pad"
          mode="outlined"
          placeholder={vm.t("expenses.amountPlaceholder")}
        />

        <TextInput
          label={vm.t("expenses.noteLabel")}
          value={vm.notes}
          onChangeText={vm.setNotes}
          mode="outlined"
          multiline
        />

        <Checkbox.Item
          label={vm.t("expenses.recurringToggleLabel")}
          status={vm.isRecurringExpense ? "checked" : "unchecked"}
          onPress={() => vm.setIsRecurringExpense((current) => !current)}
          testID="expense-recurring-toggle"
        />

        <Button mode="outlined" onPress={() => vm.setPayerDialogVisible(true)}>
          {vm.t("expenses.paidByLabel")}:{" "}
          {vm.paidBy ? vm.getMemberLabel(vm.paidBy) : vm.t("expenses.selectPrompt")}
        </Button>

        <Button mode="outlined" onPress={() => vm.setSplitDialogVisible(true)}>
          {vm.t("expenses.selectMembersButton")} ({vm.splitBetween.length}/{vm.members.length})
        </Button>

        <Text variant="bodyMedium">
          {vm.t("expenses.splitBetweenLabel")}:{" "}
          {vm.splitBetween.length > 0
            ? vm.splitBetween.map(vm.getMemberLabel).join(", ")
            : vm.t("expenses.nobodySelected")}
        </Text>

        <SegmentedButtons
          value={vm.splitMode}
          onValueChange={(value) => vm.setSplitMode(value as SplitMode)}
          buttons={[
            { value: "equal", label: vm.t("expenses.splitModeEqual") },
            { value: "amount", label: vm.t("expenses.splitModeAmount") },
            { value: "percent", label: "%" },
          ]}
        />

        {vm.splitMode !== "equal" && (
          <View style={layout.formContent}>
            {vm.splitBetween.map((userId) => (
              <TextInput
                key={userId}
                label={`${vm.getMemberLabel(userId)} ${vm.splitMode === "percent" ? "%" : "€"}`}
                value={vm.splitSharesText[userId] ?? ""}
                onChangeText={(value) => vm.updateSplitShare(userId, value)}
                keyboardType="decimal-pad"
                mode="outlined"
              />
            ))}
          </View>
        )}

        {vm.isRecurringExpense && (
          <View style={layout.formContent}>
            <TextInput
              label={vm.t("expenses.recurringStartDateLabel")}
              testID="recurring-start-date-input"
              value={vm.recurringStartDate}
              onChangeText={vm.setRecurringStartDate}
              mode="outlined"
              placeholder={vm.t("expenses.recurringStartDatePlaceholder")}
            />

            <View style={styles.intervalRow}>
              <TextInput
                label={vm.t("expenses.recurringIntervalCountLabel")}
                testID="recurring-interval-count-input"
                value={vm.recurringIntervalCountText}
                onChangeText={vm.setRecurringIntervalCountText}
                keyboardType="number-pad"
                mode="outlined"
                style={styles.intervalCountField}
              />
              <Text variant="labelMedium">{vm.t("expenses.recurringIntervalUnitLabel")}</Text>
              <SegmentedButtons
                value={vm.recurringIntervalUnit}
                onValueChange={(value) =>
                  vm.setRecurringIntervalUnit(value as RecurringIntervalUnit)
                }
                buttons={[
                  { value: "day", label: vm.t("expenses.recurringIntervalDay") },
                  { value: "week", label: vm.t("expenses.recurringIntervalWeek") },
                  { value: "month", label: vm.t("expenses.recurringIntervalMonth") },
                  { value: "year", label: vm.t("expenses.recurringIntervalYear") },
                ]}
                style={styles.intervalUnitButtons}
              />
            </View>
          </View>
        )}

        <Button
          mode="contained"
          loading={vm.isRecurringExpense && vm.isCreatingRecurring}
          onPress={() => void vm.addExpense()}
          testID="expense-submit-button"
        >
          {vm.isRecurringExpense
            ? vm.t("expenses.recurringCreateButton")
            : vm.t("expenses.addExpenseButton")}
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  intervalRow: {
    gap: 12,
  },
  intervalCountField: {
    minWidth: 120,
  },
  intervalUnitButtons: {
    flexShrink: 1,
  },
});
