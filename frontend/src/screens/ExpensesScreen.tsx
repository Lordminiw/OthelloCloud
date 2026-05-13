import { useEffect, useState } from "react";
import { Button, FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { calculateBalances, createExpense, Expense, loadExpenses } from "../lib/expenses";
import { HouseholdMember, loadHouseholdMembers } from "../lib/members";
import { pb } from "../lib/pocketbase";

export function ExpensesScreen({ householdId }: { householdId: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [payerModalVisible, setPayerModalVisible] = useState(false);

  async function reload() {
    try {
      console.log("Loading expenses...");
      const expenseRecords = await loadExpenses(householdId);
      console.log("Expenses loaded:", expenseRecords);

      console.log("Loading household members...");
      const memberRecords = await loadHouseholdMembers(householdId);
      console.log("Members loaded:", memberRecords);

      setExpenses(expenseRecords);
      setMembers(memberRecords);

      if (!paidBy) {
        setPaidBy(pb.authStore.model?.id ?? memberRecords[0]?.userId ?? null);
      }

      if (splitBetween.length === 0) {
        setSplitBetween(memberRecords.map((member) => member.userId));
      }
    } catch (error: any) {
      console.log("EXPENSE LOAD ERROR:", error);
      console.log("STATUS:", error?.status);
      console.log("MESSAGE:", error?.message);
      console.log("RESPONSE:", error?.response);

      alert(
        "Fehler beim Laden:\n\n" +
          "Status: " +
          error?.status +
          "\n" +
          "Message: " +
          error?.message +
          "\n" +
          "Response: " +
          JSON.stringify(error?.response, null, 2),
      );
    }
  }
  async function addExpense() {
    const amount = Number(amountText.replace(",", "."));

    if (!description.trim()) return;

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
  useEffect(() => {
    reload();
  }, [householdId]);

  const balances = calculateBalances(expenses);

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

  return (
    <View style={{ flex: 1, backgroundColor: "white", padding: 24, gap: 12 }}>
      <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>Ausgaben</Text>

      <TextInput
        placeholder="Beschreibung"
        placeholderTextColor="#666"
        value={description}
        onChangeText={setDescription}
        style={{
          borderWidth: 1,
          borderColor: "#999",
          color: "black",
          backgroundColor: "white",
          padding: 8,
        }}
      />

      <TextInput
        placeholder="Betrag, z.B. 12.50"
        placeholderTextColor="#666"
        value={amountText}
        onChangeText={setAmountText}
        keyboardType="decimal-pad"
        style={{
          borderWidth: 1,
          borderColor: "#999",
          color: "black",
          backgroundColor: "white",
          padding: 8,
        }}
      />

      <Button title={`Bezahlt von: ${paidBy ? getMemberLabel(paidBy) : "auswählen"}`} onPress={() => setPayerModalVisible(true)} />

      <Button title={`Mitglieder auswählen (${splitBetween.length}/${members.length})`} onPress={() => setMemberModalVisible(true)} />

      <Text style={{ color: "black" }}>Split zwischen: {splitBetween.length > 0 ? splitBetween.map(getMemberLabel).join(", ") : "niemand ausgewählt"}</Text>

      <Button title="Ausgabe hinzufügen" onPress={addExpense} />

      <Text style={{ color: "black", fontSize: 20, fontWeight: "bold" }}>Salden</Text>

      {balances.map((balance) => (
        <Text key={balance.userId} style={{ color: "black" }}>
          {getMemberLabel(balance.userId)}: {balance.amount.toFixed(2)} €
        </Text>
      ))}

      <Text style={{ color: "black", fontSize: 20, fontWeight: "bold" }}>Letzte Ausgaben</Text>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={{ color: "black", padding: 8 }}>
            {item.description}: {item.amount.toFixed(2)} € bezahlt von {getMemberLabel(item.paidBy)}
            {"\n"}
            Split: {item.splitBetween.map(getMemberLabel).join(", ")}
          </Text>
        )}
      />
      <Modal visible={memberModalVisible} transparent animationType="slide" onRequestClose={() => setMemberModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 20,
              maxHeight: "80%",
              gap: 12,
            }}
          >
            <Text style={{ color: "black", fontSize: 22, fontWeight: "bold" }}>Wer zahlt mit?</Text>

            <Text style={{ color: "#666" }}>Wähle alle Personen aus, auf die diese Ausgabe aufgeteilt werden soll.</Text>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button title="Alle" onPress={selectAllMembers} />
              <Button title="Keine" onPress={clearSelectedMembers} />
            </View>

            <ScrollView>
              {members.map((member) => {
                const selected = splitBetween.includes(member.userId);

                return (
                  <Pressable
                    key={member.userId}
                    onPress={() => toggleSplitMember(member.userId)}
                    style={{
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#ddd",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "black", fontSize: 18 }}>{member.name || member.email}</Text>

                    <Text style={{ color: "black", fontSize: 22 }}>{selected ? "☑️" : "⬜"}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Button title="Auswahl übernehmen" onPress={() => setMemberModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={payerModalVisible} transparent animationType="slide" onRequestClose={() => setPayerModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 20,
              maxHeight: "80%",
              gap: 12,
            }}
          >
            <Text style={{ color: "black", fontSize: 22, fontWeight: "bold" }}>Wer hat bezahlt?</Text>

            <ScrollView>
              {members.map((member) => {
                const selected = paidBy === member.userId;

                return (
                  <Pressable
                    key={member.userId}
                    onPress={() => {
                      setPaidBy(member.userId);
                      setPayerModalVisible(false);
                    }}
                    style={{
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#ddd",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "black", fontSize: 18 }}>{member.name || member.email}</Text>

                    <Text style={{ color: "black", fontSize: 22 }}>{selected ? "✅" : ""}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Button title="Abbrechen" onPress={() => setPayerModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
