import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import {
  Card,
  Checkbox,
  Dialog,
  Divider,
  List,
  Portal,
  RadioButton,
  SegmentedButtons,
  Text,
} from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
import {
  BrandButton as Button,
  BrandTextInput as TextInput,
  SurfaceChip,
  useBrandSurfaceStyles,
} from "@/components/brand-ui";
import {
  calculateBalances,
  createExpense,
  createSettlement,
  deleteExpense,
  deleteSettlement,
  Expense,
  loadExpenses,
  loadSettlements,
  Settlement,
  SplitMode,
  suggestPayments,
  updateExpense,
} from "../lib/expenses";
import { HouseholdMember, loadHouseholdMembers } from "../lib/members";
import { pb } from "../lib/pocketbase";
import { HouseholdDropdown } from "@/components/household-dropdown";
import { useLanguage } from "@/context/language-context";

export function ExpensesScreen({ householdId }: { householdId: string }) {
  const { language } = useLanguage();
  const brandStyles = useBrandSurfaceStyles();
  const isGerman = language === "de";
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");
  const [notes, setNotes] = useState("");

  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [splitSharesText, setSplitSharesText] = useState<Record<string, string>>(
    {}
  );

  const [payerDialogVisible, setPayerDialogVisible] = useState(false);
  const [splitDialogVisible, setSplitDialogVisible] = useState(false);
  const [settlementDialogVisible, setSettlementDialogVisible] = useState(false);

  const [settlementFromUser, setSettlementFromUser] = useState<string | null>(
    null
  );
  const [settlementToUser, setSettlementToUser] = useState<string | null>(null);
  const [settlementAmountText, setSettlementAmountText] = useState("");

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmountText, setEditAmountText] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPaidBy, setEditPaidBy] = useState<string | null>(null);
  const [editSplitBetween, setEditSplitBetween] = useState<string[]>([]);
  const [editSplitMode, setEditSplitMode] = useState<SplitMode>("equal");
  const [editSplitSharesText, setEditSplitSharesText] = useState<
    Record<string, string>
  >({});

  const reload = useCallback(async () => {
    try {
      const [expenseRecords, settlementRecords, memberRecords] =
        await Promise.all([
          loadExpenses(householdId),
          loadSettlements(householdId),
          loadHouseholdMembers(householdId),
        ]);

      setExpenses(expenseRecords);
      setSettlements(settlementRecords);
      setMembers(memberRecords);

      if (splitBetween.length === 0) {
        setSplitBetween(memberRecords.map((member) => member.userId));
      }

      if (!paidBy) {
        setPaidBy(pb.authStore.model?.id ?? memberRecords[0]?.userId ?? null);
      }

      if (!settlementFromUser) {
        setSettlementFromUser(memberRecords[0]?.userId ?? null);
      }

      if (!settlementToUser) {
        setSettlementToUser(memberRecords[1]?.userId ?? null);
      }
    } catch (error: any) {
      console.log("EXPENSE LOAD ERROR:", error);
      console.log("RESPONSE:", error?.response);
      alert(JSON.stringify(error?.response, null, 2));
    }
  }, [householdId, paidBy, settlementFromUser, settlementToUser, splitBetween.length]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function getMemberLabel(userId: string) {
    const member = members.find((member) => member.userId === userId);
    return member?.name || member?.email || userId;
  }

  function toggleSplitMember(userId: string) {
    setSplitBetween((current) => {
      if (current.includes(userId)) {
        return current.filter((id) => id !== userId);
      }

      return [...current, userId];
    });
  }

  function selectAllMembers() {
    setSplitBetween(members.map((member) => member.userId));
  }

  function clearSelectedMembers() {
    setSplitBetween([]);
  }

  function updateSplitShare(userId: string, value: string) {
    setSplitSharesText((current) => ({
      ...current,
      [userId]: value,
    }));
  }

  function updateEditSplitShare(userId: string, value: string) {
    setEditSplitSharesText((current) => ({
      ...current,
      [userId]: value,
    }));
  }

  function buildSplitShares(input: {
    amount: number;
    mode: SplitMode;
    participants: string[];
    sharesText: Record<string, string>;
  }) {
    if (input.mode === "equal") {
      return undefined;
    }

    const splitShares = Object.fromEntries(
      input.participants.map((userId) => [
        userId,
        Number((input.sharesText[userId] ?? "").replace(",", ".")),
      ])
    );

    const invalidShare = Object.values(splitShares).some(
      (share) => !Number.isFinite(share) || share < 0
    );

    if (invalidShare) {
      alert(isGerman ? "Bitte gültige Split-Werte eingeben." : "Please enter valid split values.");
      return null;
    }

    const total = Object.values(splitShares).reduce(
      (sum, share) => sum + share,
      0
    );

    if (input.mode === "amount" && Math.abs(total - input.amount) >= 0.01) {
      alert(
        isGerman
          ? `Die Einzelbeträge müssen zusammen ${input.amount.toFixed(2)} € ergeben.`
          : `The individual amounts must add up to €${input.amount.toFixed(2)}.`
      );
      return null;
    }

    if (input.mode === "percent" && Math.abs(total - 100) >= 0.01) {
      alert(
        isGerman
          ? "Die Prozentwerte müssen zusammen 100 % ergeben."
          : "The percentages must add up to 100%."
      );
      return null;
    }

    return splitShares;
  }

  function getSplitModeLabel(mode: SplitMode | undefined) {
    if (mode === "amount") return isGerman ? "Beträge" : "Amounts";
    if (mode === "percent") return isGerman ? "Prozent" : "Percent";
    return isGerman ? "Gleich" : "Equal";
  }

  function getExpenseSplitDescription(expense: Expense) {
    const lines = [
      `${isGerman ? "Bezahlt von" : "Paid by"} ${getMemberLabel(expense.paidBy)}`,
      `${getSplitModeLabel(expense.splitMode)}: ${expense.splitBetween
        .map(getMemberLabel)
        .join(", ")}`,
    ];

    if (expense.notes?.trim()) {
      lines.push(`${isGerman ? "Notiz" : "Note"}: ${expense.notes.trim()}`);
    }

    return lines.join("\n");
  }

  function parseSharesText(expense: Expense) {
    try {
      const parsed = expense.splitShares ? JSON.parse(expense.splitShares) : {};

      return Object.fromEntries(
        (expense.splitBetween ?? []).map((userId) => [
          userId,
          parsed[userId] !== undefined ? String(parsed[userId]) : "",
        ])
      );
    } catch {
      return {};
    }
  }

  function openEditExpense(expense: Expense) {
    setEditingExpense(expense);
    setEditDescription(expense.description);
    setEditAmountText(String(expense.amount));
    setEditNotes(expense.notes ?? "");
    setEditPaidBy(expense.paidBy);
    setEditSplitBetween(expense.splitBetween ?? []);
    setEditSplitMode(expense.splitMode ?? "equal");
    setEditSplitSharesText(parseSharesText(expense));
  }

  function toggleEditSplitMember(userId: string) {
    setEditSplitBetween((current) => {
      if (current.includes(userId)) {
        return current.filter((id) => id !== userId);
      }

      return [...current, userId];
    });
  }

  function selectAllEditMembers() {
    setEditSplitBetween(members.map((member) => member.userId));
  }

  function clearSelectedEditMembers() {
    setEditSplitBetween([]);
  }

  async function addExpense() {
    const amount = Number(amountText.replace(",", "."));

    if (!description.trim()) {
      alert(isGerman ? "Bitte Beschreibung eingeben." : "Please enter a description.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert(isGerman ? "Bitte gültigen Betrag eingeben." : "Please enter a valid amount.");
      return;
    }

    if (!paidBy) {
      alert(isGerman ? "Bitte auswählen, wer bezahlt hat." : "Please choose who paid.");
      return;
    }

    if (splitBetween.length === 0) {
      alert(
        isGerman
          ? "Bitte mindestens eine Person auswählen, die mitzahlt."
          : "Please select at least one person who shares the expense."
      );
      return;
    }

    const splitShares = buildSplitShares({
      amount,
      mode: splitMode,
      participants: splitBetween,
      sharesText: splitSharesText,
    });

    if (splitShares === null) {
      return;
    }

    try {
      await createExpense({
        householdId,
        description: description.trim(),
        amount,
        paidBy,
        splitBetween,
        splitMode,
        splitShares,
        notes: notes.trim(),
      });

      setDescription("");
      setAmountText("");
      setNotes("");
      setSplitMode("equal");
      setSplitSharesText({});
      selectAllMembers();
      setPaidBy(pb.authStore.model?.id ?? paidBy);

      await reload();
    } catch (error: any) {
      console.log("ADD EXPENSE ERROR:", error);
      console.log("RESPONSE:", error?.response);
      alert(JSON.stringify(error?.response, null, 2));
    }
  }

  async function addSettlement() {
    const amount = Number(settlementAmountText.replace(",", "."));

    if (!settlementFromUser || !settlementToUser) {
      alert(isGerman ? "Bitte beide Personen auswählen." : "Please select both people.");
      return;
    }

    if (settlementFromUser === settlementToUser) {
      alert(
        isGerman
          ? "Sender und Empfänger dürfen nicht gleich sein."
          : "Sender and recipient cannot be the same."
      );
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert(isGerman ? "Bitte gültigen Betrag eingeben." : "Please enter a valid amount.");
      return;
    }

    try {
      await createSettlement({
        householdId,
        fromUser: settlementFromUser,
        toUser: settlementToUser,
        amount,
      });

      setSettlementAmountText("");
      setSettlementDialogVisible(false);

      await reload();
    } catch (error: any) {
      console.log("ADD SETTLEMENT ERROR:", error);
      console.log("RESPONSE:", error?.response);
      alert(JSON.stringify(error?.response, null, 2));
    }
  }

  async function saveEditedExpense() {
    if (!editingExpense) {
      return;
    }

    const amount = Number(editAmountText.replace(",", "."));

    if (!editDescription.trim()) {
      alert(isGerman ? "Bitte Beschreibung eingeben." : "Please enter a description.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert(isGerman ? "Bitte gültigen Betrag eingeben." : "Please enter a valid amount.");
      return;
    }

    if (!editPaidBy) {
      alert(isGerman ? "Bitte auswählen, wer bezahlt hat." : "Please choose who paid.");
      return;
    }

    if (editSplitBetween.length === 0) {
      alert(
        isGerman
          ? "Bitte mindestens eine Person auswählen, die mitzahlt."
          : "Please select at least one person who shares the expense."
      );
      return;
    }

    const splitShares = buildSplitShares({
      amount,
      mode: editSplitMode,
      participants: editSplitBetween,
      sharesText: editSplitSharesText,
    });

    if (splitShares === null) {
      return;
    }

    try {
      await updateExpense({
        expenseId: editingExpense.id,
        description: editDescription.trim(),
        amount,
        paidBy: editPaidBy,
        splitBetween: editSplitBetween,
        splitMode: editSplitMode,
        splitShares,
        notes: editNotes.trim(),
      });

      setEditingExpense(null);
      await reload();
    } catch (error: any) {
      console.log("UPDATE EXPENSE ERROR:", error);
      console.log("RESPONSE:", error?.response);
      alert(JSON.stringify(error?.response, null, 2));
    }
  }

  function openSettlementFromSuggestion(suggestion: {
    fromUser: string;
    toUser: string;
    amount: number;
  }) {
    setSettlementFromUser(suggestion.fromUser);
    setSettlementToUser(suggestion.toUser);
    setSettlementAmountText(suggestion.amount.toFixed(2));
    setSettlementDialogVisible(true);
  }

  const balances = calculateBalances({
    expenses,
    settlements,
  });

  const paymentSuggestions = suggestPayments(balances);

  return (
    <AppScreen
      title={isGerman ? "Ausgaben" : "Expenses"}
      eyebrow="Finance Deck"
      subtitle="Track household spend, balances, and settlements in a more deliberate command-center layout."
      right={<HouseholdDropdown />}
      browserTitle={isGerman ? "OthelloCloud - Ausgaben" : "OthelloCloud - Expenses"}
    >
      <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
        <Card style={[layout.card, isWide && layout.wideForm, brandStyles.panelCard]}>
          <Card.Title title={isGerman ? "Neue Ausgabe" : "New expense"} />
          <Card.Content style={layout.formContent}>
            <SurfaceChip label={isGerman ? "Live Salden" : "Live balances"} active />
            <TextInput
              label={isGerman ? "Beschreibung" : "Description"}
              value={description}
              onChangeText={setDescription}
              mode="outlined"
            />

            <TextInput
              label={isGerman ? "Betrag" : "Amount"}
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="decimal-pad"
              mode="outlined"
              placeholder={isGerman ? "z. B. 12.50" : "e.g. 12.50"}
            />

            <TextInput
              label={isGerman ? "Notiz optional" : "Note optional"}
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
            />

            <Button mode="outlined" onPress={() => setPayerDialogVisible(true)}>
              {isGerman ? "Bezahlt von" : "Paid by"}: {paidBy ? getMemberLabel(paidBy) : (isGerman ? "auswählen" : "select")}
            </Button>

            <Button mode="outlined" onPress={() => setSplitDialogVisible(true)}>
              {isGerman ? "Mitglieder auswählen" : "Select members"} ({splitBetween.length}/{members.length})
            </Button>

            <Text variant="bodyMedium">
              {isGerman ? "Split zwischen:" : "Split between:"}{" "}
              {splitBetween.length > 0
                ? splitBetween.map(getMemberLabel).join(", ")
                : (isGerman ? "niemand ausgewählt" : "nobody selected")}
            </Text>

            <SegmentedButtons
              value={splitMode}
              onValueChange={(value) => setSplitMode(value as SplitMode)}
              buttons={[
                { value: "equal", label: isGerman ? "Gleich" : "Equal" },
                { value: "amount", label: isGerman ? "Betrag" : "Amount" },
                { value: "percent", label: "%" },
              ]}
            />

            {splitMode !== "equal" && (
              <View style={layout.formContent}>
                {splitBetween.map((userId) => (
                  <TextInput
                    key={userId}
                    label={`${getMemberLabel(userId)} ${splitMode === "percent" ? "in %" : "in €"}`}
                    value={splitSharesText[userId] ?? ""}
                    onChangeText={(value) => updateSplitShare(userId, value)}
                    keyboardType="decimal-pad"
                    mode="outlined"
                  />
                ))}
              </View>
            )}

            <Button mode="contained" onPress={addExpense}>
              {isGerman ? "Ausgabe hinzufügen" : "Add expense"}
            </Button>
          </Card.Content>
        </Card>

        <View style={[layout.stack, isWide && layout.widePanel]}>
        <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
        <Card style={[layout.card, layout.twoColumnCard, brandStyles.panelCard]}>
          <Card.Title title={isGerman ? "Salden" : "Balances"} />
          <Card.Content style={layout.listCardContent}>
            {balances.length === 0 && (
              <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                {isGerman ? "Alles ausgeglichen." : "Everything is balanced."}
              </Text>
            )}

            {balances.length > 0 && (
              <ScrollView
                nestedScrollEnabled
                style={!isWide && styles.mobileCardList}
              >
                {balances.map((balance) => (
                  <List.Item
                    key={balance.userId}
                    title={getMemberLabel(balance.userId)}
                    description={`${balance.amount.toFixed(2)} €`}
                    left={(props) => <List.Icon {...props} icon="account" />}
                  />
                ))}
              </ScrollView>
            )}
          </Card.Content>
        </Card>

        <Card style={[layout.card, layout.twoColumnCard, brandStyles.panelCard]}>
          <Card.Title title={isGerman ? "Zahlungsvorschläge" : "Payment suggestions"} />
          <Card.Content style={layout.listCardContent}>
            {paymentSuggestions.length === 0 && (
              <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                {isGerman ? "Keine offenen Zahlungen." : "No open payments."}
              </Text>
            )}

            {paymentSuggestions.length > 0 && (
              <ScrollView
                nestedScrollEnabled
                style={!isWide && styles.paymentSuggestionList}
              >
                {paymentSuggestions.map((suggestion, index) => (
                  <View
                    key={`${suggestion.fromUser}-${suggestion.toUser}-${index}`}
                  >
                    <List.Item
                      title={`${getMemberLabel(suggestion.fromUser)} ${isGerman ? "zahlt" : "pays"} ${suggestion.amount.toFixed(2)} €`}
                      description={`${isGerman ? "an" : "to"} ${getMemberLabel(suggestion.toUser)}`}
                      left={(props) => (
                        <List.Icon {...props} icon="cash-fast" />
                      )}
                      right={() => (
                        <Button
                          mode="text"
                          onPress={() => openSettlementFromSuggestion(suggestion)}
                        >
                          {isGerman ? "Bezahlt" : "Paid"}
                        </Button>
                      )}
                    />
                    <Divider style={brandStyles.divider} />
                  </View>
                ))}
              </ScrollView>
            )}

            <Button
              mode="outlined"
              onPress={() => setSettlementDialogVisible(true)}
              style={styles.paymentManualButton}
            >
              {isGerman ? "Ausgleich manuell eintragen" : "Add settlement manually"}
            </Button>
          </Card.Content>
        </Card>
        </View>

        <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
        <Card style={[layout.card, layout.twoColumnCard, brandStyles.panelCard]}>
          <Card.Title title={isGerman ? "Letzte Ausgaben" : "Recent expenses"} />
          <Card.Content style={layout.listCardContent}>
            {expenses.length === 0 && (
              <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                {isGerman ? "Noch keine Ausgaben." : "No expenses yet."}
              </Text>
            )}

            {expenses.length > 0 && (
              <ScrollView
                nestedScrollEnabled
                style={!isWide && styles.mobileCardList}
              >
                {expenses.map((expense) => (
                  <View key={expense.id}>
                    <List.Item
                      title={`${expense.description}: ${expense.amount.toFixed(2)} €`}
                      description={getExpenseSplitDescription(expense)}
                      left={(props) => (
                        <List.Icon {...props} icon="receipt" />
                      )}
                      right={() => (
                        <View>
                          <Button mode="text" onPress={() => openEditExpense(expense)}>
                            {isGerman ? "Bearbeiten" : "Edit"}
                          </Button>
                          <Button
                            mode="text"
                            onPress={async () => {
                              await deleteExpense(expense.id);
                              await reload();
                            }}
                          >
                            {isGerman ? "Löschen" : "Delete"}
                          </Button>
                        </View>
                      )}
                    />
                    <Divider style={brandStyles.divider} />
                  </View>
                ))}
              </ScrollView>
            )}
          </Card.Content>
        </Card>

        <Card style={[layout.card, layout.twoColumnCard, brandStyles.panelCard]}>
          <Card.Title title={isGerman ? "Ausgleichszahlungen" : "Settlements"} />
          <Card.Content style={layout.listCardContent}>
            {settlements.length === 0 && (
              <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                {isGerman ? "Noch keine Ausgleichszahlungen." : "No settlements yet."}
              </Text>
            )}

            {settlements.length > 0 && (
              <ScrollView
                nestedScrollEnabled
                style={!isWide && styles.mobileCardList}
              >
                {settlements.map((settlement) => (
                  <View key={settlement.id}>
                    <List.Item
                      title={`${getMemberLabel(
                        settlement.fromUser
                      )} ${isGerman ? "zahlte" : "paid"} ${settlement.amount.toFixed(2)} €`}
                      description={`${isGerman ? "an" : "to"} ${getMemberLabel(settlement.toUser)}`}
                      left={(props) => (
                        <List.Icon {...props} icon="bank-transfer" />
                      )}
                      right={() => (
                        <Button
                          mode="text"
                          onPress={async () => {
                            await deleteSettlement(settlement.id);
                            await reload();
                          }}
                        >
                          {isGerman ? "Löschen" : "Delete"}
                        </Button>
                      )}
                    />
                    <Divider style={brandStyles.divider} />
                  </View>
                ))}
              </ScrollView>
            )}
          </Card.Content>
        </Card>
        </View>
        </View>
      </View>

      <Portal>
        <Dialog
          visible={payerDialogVisible}
          onDismiss={() => setPayerDialogVisible(false)}
        >
          <Dialog.Title>{isGerman ? "Wer hat bezahlt?" : "Who paid?"}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <RadioButton.Group
                onValueChange={(value) => setPaidBy(value)}
                value={paidBy ?? ""}
              >
                {members.map((member) => (
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
            <Button onPress={() => setPayerDialogVisible(false)}>
              {isGerman ? "Übernehmen" : "Apply"}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={splitDialogVisible}
          onDismiss={() => setSplitDialogVisible(false)}
        >
          <Dialog.Title>{isGerman ? "Wer zahlt mit?" : "Who shares?"}</Dialog.Title>
          <Dialog.Content>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              <Button mode="outlined" onPress={selectAllMembers}>
                {isGerman ? "Alle" : "All"}
              </Button>
              <Button mode="outlined" onPress={clearSelectedMembers}>
                {isGerman ? "Keine" : "None"}
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.ScrollArea>
            <ScrollView>
              {members.map((member) => (
                <Checkbox.Item
                  key={member.userId}
                  label={member.name || member.email}
                  status={
                    splitBetween.includes(member.userId)
                      ? "checked"
                      : "unchecked"
                  }
                  onPress={() => toggleSplitMember(member.userId)}
                />
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setSplitDialogVisible(false)}>
              {isGerman ? "Übernehmen" : "Apply"}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={editingExpense !== null}
          onDismiss={() => setEditingExpense(null)}
          style={styles.mobileDialog}
        >
          <Dialog.Title>{isGerman ? "Ausgabe bearbeiten" : "Edit expense"}</Dialog.Title>
          <Dialog.ScrollArea style={styles.editDialogScrollArea}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.editDialogContent}
            >
              <TextInput
                label={isGerman ? "Beschreibung" : "Description"}
                value={editDescription}
                onChangeText={setEditDescription}
                mode="outlined"
                style={{ marginBottom: 12 }}
              />

              <TextInput
                label={isGerman ? "Betrag" : "Amount"}
                value={editAmountText}
                onChangeText={setEditAmountText}
                keyboardType="decimal-pad"
                mode="outlined"
                style={{ marginBottom: 12 }}
              />

              <TextInput
                label={isGerman ? "Notiz optional" : "Note optional"}
                value={editNotes}
                onChangeText={setEditNotes}
                mode="outlined"
                multiline
                style={{ marginBottom: 12 }}
              />

              <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                {isGerman ? "Bezahlt von" : "Paid by"}
              </Text>

              <RadioButton.Group
                onValueChange={(value) => setEditPaidBy(value)}
                value={editPaidBy ?? ""}
              >
                {members.map((member) => (
                  <RadioButton.Item
                    key={`edit-paid-${member.userId}`}
                    label={member.name || member.email}
                    value={member.userId}
                  />
                ))}
              </RadioButton.Group>

              <Text variant="titleMedium" style={{ marginVertical: 8 }}>
                Split
              </Text>

              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <Button mode="outlined" onPress={selectAllEditMembers}>
                  {isGerman ? "Alle" : "All"}
                </Button>
                <Button mode="outlined" onPress={clearSelectedEditMembers}>
                  {isGerman ? "Keine" : "None"}
                </Button>
              </View>

              {members.map((member) => (
                <Checkbox.Item
                  key={`edit-split-${member.userId}`}
                  label={member.name || member.email}
                  status={
                    editSplitBetween.includes(member.userId)
                      ? "checked"
                      : "unchecked"
                  }
                  onPress={() => toggleEditSplitMember(member.userId)}
                />
              ))}

              <SegmentedButtons
                value={editSplitMode}
                onValueChange={(value) => setEditSplitMode(value as SplitMode)}
                buttons={[
                  { value: "equal", label: isGerman ? "Gleich" : "Equal" },
                  { value: "amount", label: isGerman ? "Betrag" : "Amount" },
                  { value: "percent", label: "%" },
                ]}
                style={{ marginTop: 12 }}
              />

              {editSplitMode !== "equal" && (
                <View style={{ gap: 12, marginTop: 12 }}>
                  {editSplitBetween.map((userId) => (
                    <TextInput
                      key={`edit-share-${userId}`}
                      label={`${getMemberLabel(userId)} ${editSplitMode === "percent" ? "in %" : "in €"}`}
                      value={editSplitSharesText[userId] ?? ""}
                      onChangeText={(value) => updateEditSplitShare(userId, value)}
                      keyboardType="decimal-pad"
                      mode="outlined"
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setEditingExpense(null)}>{isGerman ? "Abbrechen" : "Cancel"}</Button>
            <Button onPress={saveEditedExpense}>{isGerman ? "Speichern" : "Save"}</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={settlementDialogVisible}
          onDismiss={() => setSettlementDialogVisible(false)}
        >
          <Dialog.Title>{isGerman ? "Ausgleichszahlung" : "Settlement"}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <Text variant="titleMedium" style={{ marginVertical: 8 }}>
                {isGerman ? "Von" : "From"}
              </Text>

              <RadioButton.Group
                onValueChange={(value) => setSettlementFromUser(value)}
                value={settlementFromUser ?? ""}
              >
                {members.map((member) => (
                  <RadioButton.Item
                    key={`from-${member.userId}`}
                    label={member.name || member.email}
                    value={member.userId}
                  />
                ))}
              </RadioButton.Group>

              <Text variant="titleMedium" style={{ marginVertical: 8 }}>
                {isGerman ? "An" : "To"}
              </Text>

              <RadioButton.Group
                onValueChange={(value) => setSettlementToUser(value)}
                value={settlementToUser ?? ""}
              >
                {members.map((member) => (
                  <RadioButton.Item
                    key={`to-${member.userId}`}
                    label={member.name || member.email}
                    value={member.userId}
                  />
                ))}
              </RadioButton.Group>

              <TextInput
                label={isGerman ? "Betrag" : "Amount"}
                value={settlementAmountText}
                onChangeText={setSettlementAmountText}
                keyboardType="decimal-pad"
                mode="outlined"
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setSettlementDialogVisible(false)}>{isGerman ? "Abbrechen" : "Cancel"}</Button>
            <Button onPress={addSettlement}>{isGerman ? "Speichern" : "Save"}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </AppScreen>
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
  mobileDialog: {
    maxHeight: "90%",
  },
  editDialogScrollArea: {
    maxHeight: 520,
  },
  editDialogContent: {
    paddingVertical: 12,
  },
});

