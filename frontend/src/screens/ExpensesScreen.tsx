import { useEffect, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  Divider,
  List,
  Portal,
  RadioButton,
  Text,
  TextInput,
} from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
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
  suggestPayments,
} from "../lib/expenses";
import { HouseholdMember, loadHouseholdMembers } from "../lib/members";
import { pb } from "../lib/pocketbase";
import { HouseholdDropdown } from "@/components/household-dropdown";

export function ExpensesScreen({ householdId }: { householdId: string }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");

  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [splitBetween, setSplitBetween] = useState<string[]>([]);

  const [payerDialogVisible, setPayerDialogVisible] = useState(false);
  const [splitDialogVisible, setSplitDialogVisible] = useState(false);
  const [settlementDialogVisible, setSettlementDialogVisible] = useState(false);

  const [settlementFromUser, setSettlementFromUser] = useState<string | null>(
    null
  );
  const [settlementToUser, setSettlementToUser] = useState<string | null>(null);
  const [settlementAmountText, setSettlementAmountText] = useState("");

  async function reload() {
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
  }

  useEffect(() => {
    reload();
  }, [householdId]);

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

  async function addExpense() {
    const amount = Number(amountText.replace(",", "."));

    if (!description.trim()) {
      alert("Bitte Beschreibung eingeben.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Bitte gültigen Betrag eingeben.");
      return;
    }

    if (!paidBy) {
      alert("Bitte auswählen, wer bezahlt hat.");
      return;
    }

    if (splitBetween.length === 0) {
      alert("Bitte mindestens eine Person auswählen, die mitzahlt.");
      return;
    }

    try {
      await createExpense({
        householdId,
        description: description.trim(),
        amount,
        paidBy,
        splitBetween,
      });

      setDescription("");
      setAmountText("");
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
      alert("Bitte beide Personen auswählen.");
      return;
    }

    if (settlementFromUser === settlementToUser) {
      alert("Sender und Empfänger dürfen nicht gleich sein.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Bitte gültigen Betrag eingeben.");
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
    <AppScreen title="Ausgaben" right={<HouseholdDropdown />}>
      <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
        <Card style={[layout.card, isWide && layout.wideForm]}>
          <Card.Title title="Neue Ausgabe" />
          <Card.Content style={layout.formContent}>
            <TextInput
              label="Beschreibung"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
            />

            <TextInput
              label="Betrag"
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="decimal-pad"
              mode="outlined"
              placeholder="z.B. 12.50"
            />

            <Button mode="outlined" onPress={() => setPayerDialogVisible(true)}>
              Bezahlt von: {paidBy ? getMemberLabel(paidBy) : "auswählen"}
            </Button>

            <Button mode="outlined" onPress={() => setSplitDialogVisible(true)}>
              Mitglieder auswählen ({splitBetween.length}/{members.length})
            </Button>

            <Text variant="bodyMedium">
              Split zwischen:{" "}
              {splitBetween.length > 0
                ? splitBetween.map(getMemberLabel).join(", ")
                : "niemand ausgewählt"}
            </Text>

            <Button mode="contained" onPress={addExpense}>
              Ausgabe hinzufügen
            </Button>
          </Card.Content>
        </Card>

        <View style={[layout.stack, isWide && layout.widePanel]}>
        <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
        <Card style={[layout.card, layout.twoColumnCard]}>
          <Card.Title title="Salden" />
          <Card.Content style={layout.listCardContent}>
            {balances.length === 0 && (
              <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                Alles ausgeglichen.
              </Text>
            )}

            {balances.map((balance) => (
              <List.Item
                key={balance.userId}
                title={getMemberLabel(balance.userId)}
                description={`${balance.amount.toFixed(2)} €`}
                left={(props) => <List.Icon {...props} icon="account" />}
              />
            ))}
          </Card.Content>
        </Card>

        <Card style={[layout.card, layout.twoColumnCard]}>
          <Card.Title title="Zahlungsvorschläge" />
          <Card.Content style={layout.listCardContent}>
            {paymentSuggestions.length === 0 && (
              <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                Keine offenen Zahlungen.
              </Text>
            )}

            {paymentSuggestions.map((suggestion, index) => (
              <View
                key={`${suggestion.fromUser}-${suggestion.toUser}-${index}`}
              >
                <List.Item
                  title={`${getMemberLabel(suggestion.fromUser)} zahlt ${suggestion.amount.toFixed(
                    2
                  )} €`}
                  description={`an ${getMemberLabel(suggestion.toUser)}`}
                  left={(props) => (
                    <List.Icon {...props} icon="cash-fast" />
                  )}
                  right={() => (
                    <Button
                      mode="text"
                      onPress={() => openSettlementFromSuggestion(suggestion)}
                    >
                      Bezahlt
                    </Button>
                  )}
                />
                <Divider />
              </View>
            ))}

            <Button
              mode="outlined"
              onPress={() => setSettlementDialogVisible(true)}
              style={{ marginHorizontal: 16, marginTop: 8 }}
            >
              Ausgleich manuell eintragen
            </Button>
          </Card.Content>
        </Card>
        </View>

        <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
        <Card style={[layout.card, layout.twoColumnCard]}>
          <Card.Title title="Letzte Ausgaben" />
          <Card.Content style={layout.listCardContent}>
            {expenses.length === 0 && (
              <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                Noch keine Ausgaben.
              </Text>
            )}

            {expenses.map((expense) => (
              <View key={expense.id}>
                <List.Item
                  title={`${expense.description}: ${expense.amount.toFixed(
                    2
                  )} €`}
                  description={`Bezahlt von ${getMemberLabel(
                    expense.paidBy
                  )}\nSplit: ${expense.splitBetween
                    .map(getMemberLabel)
                    .join(", ")}`}
                  left={(props) => (
                    <List.Icon {...props} icon="receipt" />
                  )}
                  right={() => (
                    <Button
                      mode="text"
                      onPress={async () => {
                        await deleteExpense(expense.id);
                        await reload();
                      }}
                    >
                      Löschen
                    </Button>
                  )}
                />
                <Divider />
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={[layout.card, layout.twoColumnCard]}>
          <Card.Title title="Ausgleichszahlungen" />
          <Card.Content style={layout.listCardContent}>
            {settlements.length === 0 && (
              <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                Noch keine Ausgleichszahlungen.
              </Text>
            )}

            {settlements.map((settlement) => (
              <View key={settlement.id}>
                <List.Item
                  title={`${getMemberLabel(
                    settlement.fromUser
                  )} zahlte ${settlement.amount.toFixed(2)} €`}
                  description={`an ${getMemberLabel(settlement.toUser)}`}
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
                      Löschen
                    </Button>
                  )}
                />
                <Divider />
              </View>
            ))}
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
          <Dialog.Title>Wer hat bezahlt?</Dialog.Title>
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
              Übernehmen
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={splitDialogVisible}
          onDismiss={() => setSplitDialogVisible(false)}
        >
          <Dialog.Title>Wer zahlt mit?</Dialog.Title>
          <Dialog.Content>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              <Button mode="outlined" onPress={selectAllMembers}>
                Alle
              </Button>
              <Button mode="outlined" onPress={clearSelectedMembers}>
                Keine
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
              Übernehmen
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={settlementDialogVisible}
          onDismiss={() => setSettlementDialogVisible(false)}
        >
          <Dialog.Title>Ausgleichszahlung</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <Text variant="titleMedium" style={{ marginVertical: 8 }}>
                Von
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
                An
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
                label="Betrag"
                value={settlementAmountText}
                onChangeText={setSettlementAmountText}
                keyboardType="decimal-pad"
                mode="outlined"
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setSettlementDialogVisible(false)}>
              Abbrechen
            </Button>
            <Button onPress={addSettlement}>Speichern</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </AppScreen>
  );
}

