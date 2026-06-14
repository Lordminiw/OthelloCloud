import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Checkbox,
  Dialog,
  Portal,
  RadioButton,
  SegmentedButtons,
  Text,
  TextInput,
} from "react-native-paper";
import { SplitMode } from "../../lib/expenses";
import type { ExpensesScreenViewModel } from "./use-expenses-screen";

export function ExpenseEditDialog({ vm }: { vm: ExpensesScreenViewModel }) {
  return (
    <Portal>
      <Dialog visible={vm.payerDialogVisible} onDismiss={() => vm.setPayerDialogVisible(false)}>
        <Dialog.Title>{vm.t("expenses.whoPaidTitle")}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <RadioButton.Group
              onValueChange={(value) => vm.setPaidBy(value)}
              value={vm.paidBy ?? ""}
            >
              {vm.members.map((member) => (
                <RadioButton.Item
                  key={member.userId}
                  label={member.name || member.email}
                  value={member.userId}
                />
              ))}
            </RadioButton.Group>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={() => vm.setPayerDialogVisible(false)}>
            {vm.t("expenses.applyButton")}
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={vm.splitDialogVisible} onDismiss={() => vm.setSplitDialogVisible(false)}>
        <Dialog.Title>{vm.t("expenses.whoSharesTitle")}</Dialog.Title>
        <Dialog.Content>
          <View style={styles.inlineActionRow}>
            <Button mode="outlined" onPress={vm.selectAllMembers}>
              {vm.t("expenses.allButton")}
            </Button>
            <Button mode="outlined" onPress={vm.clearSelectedMembers}>
              {vm.t("common.none")}
            </Button>
          </View>
        </Dialog.Content>
        <Dialog.ScrollArea>
          <ScrollView>
            {vm.members.map((member) => (
              <Checkbox.Item
                key={member.userId}
                label={member.name || member.email}
                status={vm.splitBetween.includes(member.userId) ? "checked" : "unchecked"}
                onPress={() => vm.toggleSplitMember(member.userId)}
              />
            ))}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={() => vm.setSplitDialogVisible(false)}>
            {vm.t("expenses.applyButton")}
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog
        visible={vm.editingExpense !== null}
        onDismiss={() => vm.setEditingExpense(null)}
        style={styles.mobileDialog}
      >
        <Dialog.Title>{vm.t("expenses.editButton")}</Dialog.Title>
        <Dialog.ScrollArea style={styles.editDialogScrollArea}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.editDialogContent}
          >
            <TextInput
              label={vm.t("expenses.descriptionLabel")}
              value={vm.editDescription}
              onChangeText={vm.setEditDescription}
              mode="outlined"
              style={styles.dialogField}
            />

            <TextInput
              label={vm.t("expenses.amountLabel")}
              value={vm.editAmountText}
              onChangeText={vm.setEditAmountText}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.dialogField}
            />

            <TextInput
              label={vm.t("expenses.noteLabel")}
              value={vm.editNotes}
              onChangeText={vm.setEditNotes}
              mode="outlined"
              multiline
              style={styles.dialogField}
            />

            <Text variant="titleMedium" style={styles.dialogLabel}>
              {vm.t("expenses.paidByLabel")}
            </Text>

            <RadioButton.Group
              onValueChange={(value) => vm.setEditPaidBy(value)}
              value={vm.editPaidBy ?? ""}
            >
              {vm.members.map((member) => (
                <RadioButton.Item
                  key={`edit-paid-${member.userId}`}
                  label={member.name || member.email}
                  value={member.userId}
                />
              ))}
            </RadioButton.Group>

            <Text variant="titleMedium" style={styles.dialogLabel}>
              {vm.t("expenses.splitBetweenLabel")}
            </Text>

            <View style={styles.inlineActionRow}>
              <Button mode="outlined" onPress={vm.selectAllEditMembers}>
                {vm.t("expenses.allButton")}
              </Button>
              <Button mode="outlined" onPress={vm.clearSelectedEditMembers}>
                {vm.t("common.none")}
              </Button>
            </View>

            {vm.members.map((member) => (
              <Checkbox.Item
                key={`edit-split-${member.userId}`}
                label={member.name || member.email}
                status={
                  vm.editSplitBetween.includes(member.userId) ? "checked" : "unchecked"
                }
                onPress={() => vm.toggleEditSplitMember(member.userId)}
              />
            ))}

            <SegmentedButtons
              value={vm.editSplitMode}
              onValueChange={(value) => vm.setEditSplitMode(value as SplitMode)}
              buttons={[
                { value: "equal", label: vm.t("expenses.splitModeEqual") },
                { value: "amount", label: vm.t("expenses.splitModeAmount") },
                { value: "percent", label: "%" },
              ]}
              style={styles.editModeButtons}
            />

            {vm.editSplitMode !== "equal" && (
              <View style={styles.editShareFields}>
                {vm.editSplitBetween.map((userId) => (
                  <TextInput
                    key={`edit-share-${userId}`}
                    label={`${vm.getMemberLabel(userId)} ${
                      vm.editSplitMode === "percent" ? "%" : "€"
                    }`}
                    value={vm.editSplitSharesText[userId] ?? ""}
                    onChangeText={(value) => vm.updateEditSplitShare(userId, value)}
                    keyboardType="decimal-pad"
                    mode="outlined"
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={() => vm.setEditingExpense(null)}>
            {vm.t("expenses.cancelButton")}
          </Button>
          <Button onPress={() => void vm.saveEditedExpense()}>{vm.t("expenses.saveButton")}</Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog
        visible={vm.settlementDialogVisible}
        onDismiss={() => vm.setSettlementDialogVisible(false)}
      >
        <Dialog.Title>{vm.t("expenses.settlementTitle")}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <Text variant="titleMedium" style={styles.dialogLabel}>
              {vm.t("expenses.fromLabel")}
            </Text>

            <RadioButton.Group
              onValueChange={(value) => vm.setSettlementFromUser(value)}
              value={vm.settlementFromUser ?? ""}
            >
              {vm.members.map((member) => (
                <RadioButton.Item
                  key={`from-${member.userId}`}
                  label={member.name || member.email}
                  value={member.userId}
                />
              ))}
            </RadioButton.Group>

            <Text variant="titleMedium" style={styles.dialogLabel}>
              {vm.t("expenses.toLabel")}
            </Text>

            <RadioButton.Group
              onValueChange={(value) => vm.setSettlementToUser(value)}
              value={vm.settlementToUser ?? ""}
            >
              {vm.members.map((member) => (
                <RadioButton.Item
                  key={`to-${member.userId}`}
                  label={member.name || member.email}
                  value={member.userId}
                />
              ))}
            </RadioButton.Group>

            <TextInput
              label={vm.t("expenses.amountLabel")}
              value={vm.settlementAmountText}
              onChangeText={vm.setSettlementAmountText}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.settlementAmountField}
            />
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={() => vm.setSettlementDialogVisible(false)}>
            {vm.t("expenses.cancelButton")}
          </Button>
          <Button onPress={() => void vm.addSettlement()}>{vm.t("expenses.saveButton")}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  inlineActionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  mobileDialog: {
    maxHeight: "90%",
  },
  editDialogScrollArea: {
    maxHeight: 520,
  },
  editDialogContent: {
    paddingVertical: 12,
  },
  dialogField: {
    marginBottom: 12,
  },
  dialogLabel: {
    marginVertical: 8,
  },
  editModeButtons: {
    marginTop: 12,
  },
  editShareFields: {
    gap: 12,
    marginTop: 12,
  },
  settlementAmountField: {
    marginTop: 12,
  },
});
