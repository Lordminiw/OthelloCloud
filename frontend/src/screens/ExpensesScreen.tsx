import { StyleSheet, View } from "react-native";
import { AppScreen, layout } from "@/components/app-screen";
import { PageSection, SplitLayout } from "@/components/layout";
import { ExpenseEditDialog } from "./expenses/expense-edit-dialog";
import { ExpenseFormCard } from "./expenses/expense-form-card";
import { ExpenseListCard } from "./expenses/expense-list-card";
import { SettlementListCard } from "./expenses/settlement-list-card";
import { useExpensesScreen } from "./expenses/use-expenses-screen";

export function ExpensesScreen({ householdId }: { householdId: string }) {
  const vm = useExpensesScreen(householdId);

  return (
    <AppScreen title={vm.t("expenses.title")} browserTitle={vm.t("expenses.browserTitle")}>
      <PageSection>
        <SplitLayout style={!vm.isWide && styles.narrowLayout}>
          <View style={[layout.stack, vm.isWide && layout.wideForm]}>
            <ExpenseFormCard vm={vm} />
          </View>
          <View style={[layout.stack, vm.isWide && layout.widePanel]}>
            <ExpenseListCard vm={vm} />
            <SettlementListCard vm={vm} />
          </View>
        </SplitLayout>
      </PageSection>
      <ExpenseEditDialog vm={vm} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  narrowLayout: {
    flexDirection: "column",
    flexWrap: "nowrap",
  },
});
