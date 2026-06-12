import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  Divider,
  List,
  Portal,
  RadioButton,
  SegmentedButtons,
  Text,
  TextInput,
} from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
import { HouseholdDropdown } from "@/components/household-dropdown";
import { useLanguage } from "@/context/language-context";
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
import {
  buildRecurringExpensePayload,
  createRecurringExpense,
  loadRecurringExpenses,
  RecurringExpense,
  RecurringExpenseValidationField,
  RecurringIntervalUnit,
  validateRecurringExpenseInput,
} from "../lib/recurring-expenses";

type SplitShareSource = {
  splitBetween?: string[];
  splitShares?: string;
};

function getTodayDateInput() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateOnlyValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function ExpensesScreen({ householdId }: { householdId: string }) {
  const { t, language } = useLanguage();
  const isGerman = language === "de";
  const locale = isGerman ? "de-DE" : "en-US";
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const currentUserId = pb.authStore.model?.id ?? null;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [isLoadingRecurring, setIsLoadingRecurring] = useState(false);
  const [isCreatingRecurring, setIsCreatingRecurring] = useState(false);
  const [didRecurringLoadFail, setDidRecurringLoadFail] = useState(false);

  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");
  const [notes, setNotes] = useState("");
  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [splitSharesText, setSplitSharesText] = useState<Record<string, string>>({});

  const [recurringDescription, setRecurringDescription] = useState("");
  const [recurringAmountText, setRecurringAmountText] = useState("");
  const [recurringNotes, setRecurringNotes] = useState("");
  const [recurringPaidBy, setRecurringPaidBy] = useState<string | null>(null);
  const [recurringSplitBetween, setRecurringSplitBetween] = useState<string[]>([]);
  const [recurringSplitMode, setRecurringSplitMode] = useState<SplitMode>("equal");
  const [recurringSplitSharesText, setRecurringSplitSharesText] = useState<
    Record<string, string>
  >({});
  const [recurringStartDate, setRecurringStartDate] = useState(getTodayDateInput());
  const [recurringIntervalCountText, setRecurringIntervalCountText] = useState("1");
  const [recurringIntervalUnit, setRecurringIntervalUnit] =
    useState<RecurringIntervalUnit>("month");

  const [payerDialogVisible, setPayerDialogVisible] = useState(false);
  const [splitDialogVisible, setSplitDialogVisible] = useState(false);
  const [recurringPayerDialogVisible, setRecurringPayerDialogVisible] = useState(false);
  const [recurringSplitDialogVisible, setRecurringSplitDialogVisible] = useState(false);
  const [settlementDialogVisible, setSettlementDialogVisible] = useState(false);

  const [settlementFromUser, setSettlementFromUser] = useState<string | null>(null);
  const [settlementToUser, setSettlementToUser] = useState<string | null>(null);
  const [settlementAmountText, setSettlementAmountText] = useState("");

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmountText, setEditAmountText] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPaidBy, setEditPaidBy] = useState<string | null>(null);
  const [editSplitBetween, setEditSplitBetween] = useState<string[]>([]);
  const [editSplitMode, setEditSplitMode] = useState<SplitMode>("equal");
  const [editSplitSharesText, setEditSplitSharesText] = useState<Record<string, string>>({});

  const expenseById = useMemo(
    () => new Map(expenses.map((expense) => [expense.id, expense])),
    [expenses]
  );
  const recurringById = useMemo(
    () => new Map(recurringExpenses.map((expense) => [expense.id, expense])),
    [recurringExpenses]
  );

  const reload = useCallback(async () => {
    setIsLoadingRecurring(true);
    setDidRecurringLoadFail(false);

    try {
      const [expenseRecords, settlementRecords, memberRecords] = await Promise.all([
        loadExpenses(householdId),
        loadSettlements(householdId),
        loadHouseholdMembers(householdId),
      ]);

      setExpenses(expenseRecords);
      setSettlements(settlementRecords);
      setMembers(memberRecords);

      const allMemberIds = memberRecords.map((member) => member.userId);
      const memberIdSet = new Set(allMemberIds);
      const defaultPayer =
        currentUserId && memberIdSet.has(currentUserId)
          ? currentUserId
          : memberRecords[0]?.userId ?? null;

      setSplitBetween((current) => {
        const validMembers = current.filter((memberId) => memberIdSet.has(memberId));
        return validMembers.length > 0 || allMemberIds.length === 0
          ? validMembers
          : allMemberIds;
      });
      setPaidBy((current) =>
        current && memberIdSet.has(current) ? current : defaultPayer
      );
      setRecurringSplitBetween((current) => {
        const validMembers = current.filter((memberId) => memberIdSet.has(memberId));
        return validMembers.length > 0 || allMemberIds.length === 0
          ? validMembers
          : allMemberIds;
      });
      setRecurringPaidBy((current) =>
        current && memberIdSet.has(current) ? current : defaultPayer
      );
      setSettlementFromUser((current) =>
        current && memberIdSet.has(current) ? current : memberRecords[0]?.userId ?? null
      );
      setSettlementToUser((current) => {
        if (current && memberIdSet.has(current)) {
          return current;
        }

        const fallbackToUser = memberRecords.find(
          (member) => member.userId !== (memberRecords[0]?.userId ?? null)
        );

        return fallbackToUser?.userId ?? memberRecords[0]?.userId ?? null;
      });

      try {
        const recurringRecords = await loadRecurringExpenses(householdId);
        setRecurringExpenses(recurringRecords);
      } catch (error: any) {
        console.log("RECURRING EXPENSE LOAD ERROR:", error);
        console.log("RECURRING RESPONSE:", error?.response);
        setRecurringExpenses([]);
        setDidRecurringLoadFail(true);
      }
    } catch (error: any) {
      console.log("EXPENSE LOAD ERROR:", error);
      console.log("RESPONSE:", error?.response);
      alert(JSON.stringify(error?.response, null, 2));
    } finally {
      setIsLoadingRecurring(false);
    }
  }, [currentUserId, householdId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function getMemberLabel(userId: string) {
    const member = members.find((candidate) => candidate.userId === userId);
    return member?.name || member?.email || userId;
  }

  function formatDate(value: string | undefined) {
    if (!value) {
      return "";
    }

    const date = parseDateOnlyValue(value) ?? new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatDateTime(value: string | undefined) {
    if (!value) {
      return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getSplitModeLabel(mode: SplitMode | undefined) {
    if (mode === "amount") {
      return t("expenses.splitModeAmount");
    }

    if (mode === "percent") {
      return t("expenses.splitModePercent");
    }

    return t("expenses.splitModeEqual");
  }

  function getIntervalUnitLabel(unit: RecurringIntervalUnit) {
    switch (unit) {
      case "day":
        return t("expenses.recurringIntervalDay");
      case "week":
        return t("expenses.recurringIntervalWeek");
      case "year":
        return t("expenses.recurringIntervalYear");
      default:
        return t("expenses.recurringIntervalMonth");
    }
  }

  function toggleSplitMember(userId: string) {
    setSplitBetween((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }

  function toggleRecurringSplitMember(userId: string) {
    setRecurringSplitBetween((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }

  function toggleEditSplitMember(userId: string) {
    setEditSplitBetween((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }

  function selectAllMembers() {
    setSplitBetween(members.map((member) => member.userId));
  }

  function clearSelectedMembers() {
    setSplitBetween([]);
  }

  function selectAllRecurringMembers() {
    setRecurringSplitBetween(members.map((member) => member.userId));
  }

  function clearSelectedRecurringMembers() {
    setRecurringSplitBetween([]);
  }

  function selectAllEditMembers() {
    setEditSplitBetween(members.map((member) => member.userId));
  }

  function clearSelectedEditMembers() {
    setEditSplitBetween([]);
  }

  function updateSplitShare(userId: string, value: string) {
    setSplitSharesText((current) => ({
      ...current,
      [userId]: value,
    }));
  }

  function updateRecurringSplitShare(userId: string, value: string) {
    setRecurringSplitSharesText((current) => ({
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
      alert(t("expenses.validationSplitSharesInvalid"));
      return null;
    }

    const total = Object.values(splitShares).reduce((sum, share) => sum + share, 0);

    if (input.mode === "amount" && Math.abs(total - input.amount) >= 0.01) {
      alert(
        t("expenses.validationSplitAmountsTotal", {
          amount: input.amount.toFixed(2),
        })
      );
      return null;
    }

    if (input.mode === "percent" && Math.abs(total - 100) >= 0.01) {
      alert(t("expenses.validationSplitPercentTotal"));
      return null;
    }

    return splitShares;
  }

  function parseSharesText(source: SplitShareSource) {
    try {
      const parsed = source.splitShares ? JSON.parse(source.splitShares) : {};

      return Object.fromEntries(
        (source.splitBetween ?? []).map((userId) => [
          userId,
          parsed[userId] !== undefined ? String(parsed[userId]) : "",
        ])
      );
    } catch {
      return {};
    }
  }

  function getExpenseSplitDescription(expense: Expense) {
    const lines = [
      `${t("expenses.paidByLabel")} ${getMemberLabel(expense.paidBy)}`,
      `${getSplitModeLabel(expense.splitMode)}: ${expense.splitBetween.map(getMemberLabel).join(", ")}`,
    ];

    if (expense.recurringExpense) {
      const recurringRule = recurringById.get(expense.recurringExpense);
      lines.push(
        t("expenses.recurringGeneratedFromLabel", {
          name: recurringRule?.description ?? t("expenses.recurringUnknownRule"),
        })
      );
    }

    if (expense.scheduledFor) {
      lines.push(
        t("expenses.recurringScheduledForLabel", {
          date: formatDate(expense.scheduledFor),
        })
      );
    }

    if (expense.notes?.trim()) {
      lines.push(`${t("expenses.noteSummaryLabel")}: ${expense.notes.trim()}`);
    }

    return lines.join("\n");
  }

  function getRecurringDescription(expense: RecurringExpense) {
    const lines = [
      `${t("expenses.paidByLabel")} ${getMemberLabel(expense.paidBy)}`,
      `${getSplitModeLabel(expense.splitMode)}: ${expense.splitBetween.map(getMemberLabel).join(", ")}`,
      t("expenses.recurringStartLabel", {
        date: formatDate(expense.startDate),
      }),
      t("expenses.recurringEveryLabel", {
        count: expense.intervalCount,
        unit: getIntervalUnitLabel(expense.intervalUnit),
      }),
      expense.active
        ? t("expenses.recurringStatusActive")
        : t("expenses.recurringStatusPaused"),
    ];

    if (expense.nextRunAt) {
      lines.push(
        t("expenses.recurringNextRunLabel", {
          date: formatDateTime(expense.nextRunAt),
        })
      );
    }

    if (expense.lastRunAt) {
      lines.push(
        t("expenses.recurringLastRunLabel", {
          date: formatDateTime(expense.lastRunAt),
        })
      );
    }

    if (expense.lastGeneratedExpense) {
      const generatedExpense = expenseById.get(expense.lastGeneratedExpense);
      lines.push(
        t("expenses.recurringGeneratedExpenseLabel", {
          description: generatedExpense?.description ?? expense.lastGeneratedExpense,
        })
      );
    }

    if (expense.notes?.trim()) {
      lines.push(`${t("expenses.noteSummaryLabel")}: ${expense.notes.trim()}`);
    }

    if (expense.lastError?.trim()) {
      lines.push(expense.lastError.trim());
    }

    return lines.join("\n");
  }

  function getRecurringValidationMessage(
    field: RecurringExpenseValidationField
  ) {
    switch (field) {
      case "description":
        return t("expenses.validationDescriptionRequired");
      case "amount":
        return t("expenses.validationAmountInvalid");
      case "paidBy":
        return t("expenses.validationPaidByRequired");
      case "splitBetween":
        return t("expenses.validationSplitBetweenRequired");
      case "splitShares":
        return t("expenses.validationSplitSharesInvalid");
      case "startDate":
        return t("expenses.validationRecurringStartDate");
      case "intervalUnit":
        return t("expenses.validationRecurringIntervalUnit");
      case "intervalCount":
        return t("expenses.validationRecurringIntervalCount");
      default:
        return t("expenses.validationSplitSharesInvalid");
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

  async function addExpense() {
    const amount = Number(amountText.replace(",", "."));

    if (!description.trim()) {
      alert(t("expenses.validationDescriptionRequired"));
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert(t("expenses.validationAmountInvalid"));
      return;
    }

    if (!paidBy) {
      alert(t("expenses.validationPaidByRequired"));
      return;
    }

    if (splitBetween.length === 0) {
      alert(t("expenses.validationSplitBetweenRequired"));
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
      setPaidBy(currentUserId ?? paidBy);

      await reload();
    } catch (error: any) {
      console.log("ADD EXPENSE ERROR:", error);
      console.log("RESPONSE:", error?.response);
      alert(JSON.stringify(error?.response, null, 2));
    }
  }

  async function addRecurringExpenseRule() {
    const amount = Number(recurringAmountText.replace(",", "."));
    const splitShares = buildSplitShares({
      amount,
      mode: recurringSplitMode,
      participants: recurringSplitBetween,
      sharesText: recurringSplitSharesText,
    });

    if (splitShares === null) {
      return;
    }

    const validation = validateRecurringExpenseInput({
      householdId,
      description: recurringDescription,
      amountText: recurringAmountText,
      paidBy: recurringPaidBy ?? "",
      splitBetween: recurringSplitBetween,
      splitMode: recurringSplitMode,
      splitShares,
      notes: recurringNotes,
      startDate: recurringStartDate,
      intervalUnit: recurringIntervalUnit,
      intervalCountText: recurringIntervalCountText,
      active: true,
    });

    if (validation.errors.length > 0) {
      alert(getRecurringValidationMessage(validation.errors[0]));
      return;
    }

    setIsCreatingRecurring(true);

    try {
      const payload = buildRecurringExpensePayload({
        householdId,
        description: recurringDescription,
        amountText: recurringAmountText,
        paidBy: recurringPaidBy ?? "",
        splitBetween: recurringSplitBetween,
        splitMode: recurringSplitMode,
        splitShares,
        notes: recurringNotes,
        startDate: recurringStartDate,
        intervalUnit: recurringIntervalUnit,
        intervalCountText: recurringIntervalCountText,
        active: true,
      });

      await createRecurringExpense(payload);

      setRecurringDescription("");
      setRecurringAmountText("");
      setRecurringNotes("");
      setRecurringSplitMode("equal");
      setRecurringSplitSharesText({});
      setRecurringStartDate(getTodayDateInput());
      setRecurringIntervalCountText("1");
      setRecurringIntervalUnit("month");
      selectAllRecurringMembers();
      setRecurringPaidBy(currentUserId ?? recurringPaidBy);

      await reload();
      alert(t("expenses.recurringCreateSuccess"));
    } catch (error: any) {
      console.log("ADD RECURRING EXPENSE ERROR:", error);
      console.log("RESPONSE:", error?.response);
      alert(JSON.stringify(error?.response ?? error?.message ?? error, null, 2));
    } finally {
      setIsCreatingRecurring(false);
    }
  }

  async function addSettlement() {
    const amount = Number(settlementAmountText.replace(",", "."));

    if (!settlementFromUser || !settlementToUser) {
      alert(t("expenses.validationSettlementPeopleRequired"));
      return;
    }

    if (settlementFromUser === settlementToUser) {
      alert(t("expenses.validationSettlementDistinctUsers"));
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert(t("expenses.validationAmountInvalid"));
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
      alert(t("expenses.validationDescriptionRequired"));
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert(t("expenses.validationAmountInvalid"));
      return;
    }

    if (!editPaidBy) {
      alert(t("expenses.validationPaidByRequired"));
      return;
    }

    if (editSplitBetween.length === 0) {
      alert(t("expenses.validationSplitBetweenRequired"));
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
      title={t("expenses.title")}
      right={<HouseholdDropdown />}
      browserTitle={t("expenses.browserTitle")}
    >
      <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
        <View style={[layout.stack, isWide && layout.wideForm]}>
          <Card style={layout.card}>
            <Card.Title title={t("expenses.newExpenseTitle")} />
            <Card.Content style={layout.formContent}>
              <TextInput
                label={t("expenses.descriptionLabel")}
                value={description}
                onChangeText={setDescription}
                mode="outlined"
              />

              <TextInput
                label={t("expenses.amountLabel")}
                value={amountText}
                onChangeText={setAmountText}
                keyboardType="decimal-pad"
                mode="outlined"
                placeholder={t("expenses.amountPlaceholder")}
              />

              <TextInput
                label={t("expenses.noteLabel")}
                value={notes}
                onChangeText={setNotes}
                mode="outlined"
                multiline
              />

              <Button mode="outlined" onPress={() => setPayerDialogVisible(true)}>
                {t("expenses.paidByLabel")}:{" "}
                {paidBy ? getMemberLabel(paidBy) : t("expenses.selectPrompt")}
              </Button>

              <Button mode="outlined" onPress={() => setSplitDialogVisible(true)}>
                {t("expenses.selectMembersButton")} ({splitBetween.length}/{members.length})
              </Button>

              <Text variant="bodyMedium">
                {t("expenses.splitBetweenLabel")}:{" "}
                {splitBetween.length > 0
                  ? splitBetween.map(getMemberLabel).join(", ")
                  : t("expenses.nobodySelected")}
              </Text>

              <SegmentedButtons
                value={splitMode}
                onValueChange={(value) => setSplitMode(value as SplitMode)}
                buttons={[
                  { value: "equal", label: t("expenses.splitModeEqual") },
                  { value: "amount", label: t("expenses.splitModeAmount") },
                  { value: "percent", label: "%" },
                ]}
              />

              {splitMode !== "equal" && (
                <View style={layout.formContent}>
                  {splitBetween.map((userId) => (
                    <TextInput
                      key={userId}
                      label={`${getMemberLabel(userId)} ${
                        splitMode === "percent" ? "%" : "€"
                      }`}
                      value={splitSharesText[userId] ?? ""}
                      onChangeText={(value) => updateSplitShare(userId, value)}
                      keyboardType="decimal-pad"
                      mode="outlined"
                    />
                  ))}
                </View>
              )}

              <Button mode="contained" onPress={() => void addExpense()}>
                {t("expenses.addExpenseButton")}
              </Button>
            </Card.Content>
          </Card>

          <Card style={layout.card}>
            <Card.Title
              title={t("expenses.recurringTitle")}
              subtitle={isLoadingRecurring ? t("common.loading") : undefined}
            />
            <Card.Content style={layout.formContent}>
              <TextInput
                label={t("expenses.descriptionLabel")}
                testID="recurring-description-input"
                value={recurringDescription}
                onChangeText={setRecurringDescription}
                mode="outlined"
              />

              <TextInput
                label={t("expenses.amountLabel")}
                testID="recurring-amount-input"
                value={recurringAmountText}
                onChangeText={setRecurringAmountText}
                keyboardType="decimal-pad"
                mode="outlined"
                placeholder={t("expenses.amountPlaceholder")}
              />

              <TextInput
                label={t("expenses.noteLabel")}
                testID="recurring-notes-input"
                value={recurringNotes}
                onChangeText={setRecurringNotes}
                mode="outlined"
                multiline
              />

              <Button mode="outlined" onPress={() => setRecurringPayerDialogVisible(true)}>
                {t("expenses.paidByLabel")}:{" "}
                {recurringPaidBy
                  ? getMemberLabel(recurringPaidBy)
                  : t("expenses.selectPrompt")}
              </Button>

              <Button
                mode="outlined"
                onPress={() => setRecurringSplitDialogVisible(true)}
              >
                {t("expenses.selectMembersButton")} ({recurringSplitBetween.length}/
                {members.length})
              </Button>

              <Text variant="bodyMedium">
                {t("expenses.splitBetweenLabel")}:{" "}
                {recurringSplitBetween.length > 0
                  ? recurringSplitBetween.map(getMemberLabel).join(", ")
                  : t("expenses.nobodySelected")}
              </Text>

              <SegmentedButtons
                value={recurringSplitMode}
                onValueChange={(value) => setRecurringSplitMode(value as SplitMode)}
                buttons={[
                  { value: "equal", label: t("expenses.splitModeEqual") },
                  { value: "amount", label: t("expenses.splitModeAmount") },
                  { value: "percent", label: "%" },
                ]}
              />

              {recurringSplitMode !== "equal" && (
                <View style={layout.formContent}>
                  {recurringSplitBetween.map((userId) => (
                    <TextInput
                      key={`recurring-share-${userId}`}
                      label={`${getMemberLabel(userId)} ${
                        recurringSplitMode === "percent" ? "%" : "€"
                      }`}
                      value={recurringSplitSharesText[userId] ?? ""}
                      onChangeText={(value) => updateRecurringSplitShare(userId, value)}
                      keyboardType="decimal-pad"
                      mode="outlined"
                    />
                  ))}
                </View>
              )}

              <TextInput
                label={t("expenses.recurringStartDateLabel")}
                testID="recurring-start-date-input"
                value={recurringStartDate}
                onChangeText={setRecurringStartDate}
                mode="outlined"
                placeholder={t("expenses.recurringStartDatePlaceholder")}
              />

              <View style={styles.intervalRow}>
                <TextInput
                  label={t("expenses.recurringIntervalCountLabel")}
                  testID="recurring-interval-count-input"
                  value={recurringIntervalCountText}
                  onChangeText={setRecurringIntervalCountText}
                  keyboardType="number-pad"
                  mode="outlined"
                  style={styles.intervalCountField}
                />
                <Text variant="labelMedium">{t("expenses.recurringIntervalUnitLabel")}</Text>
                <SegmentedButtons
                  value={recurringIntervalUnit}
                  onValueChange={(value) =>
                    setRecurringIntervalUnit(value as RecurringIntervalUnit)
                  }
                  buttons={[
                    { value: "day", label: t("expenses.recurringIntervalDay") },
                    { value: "week", label: t("expenses.recurringIntervalWeek") },
                    { value: "month", label: t("expenses.recurringIntervalMonth") },
                    { value: "year", label: t("expenses.recurringIntervalYear") },
                  ]}
                  style={styles.intervalUnitButtons}
                />
              </View>

              <Button
                mode="contained"
                loading={isCreatingRecurring}
                onPress={() => void addRecurringExpenseRule()}
                testID="recurring-create-button"
              >
                {t("expenses.recurringCreateButton")}
              </Button>
            </Card.Content>
          </Card>
        </View>

        <View style={[layout.stack, isWide && layout.widePanel]}>
          <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
            <Card style={[layout.card, layout.twoColumnCard]}>
              <Card.Title title={t("expenses.balancesTitle")} />
              <Card.Content style={layout.listCardContent}>
                {balances.length === 0 && (
                  <Text variant="bodyMedium" style={styles.listEmptyText}>
                    {t("expenses.everythingBalanced")}
                  </Text>
                )}

                {balances.length > 0 && (
                  <ScrollView nestedScrollEnabled style={!isWide && styles.mobileCardList}>
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

            <Card style={[layout.card, layout.twoColumnCard]}>
              <Card.Title title={t("expenses.paymentSuggestionsTitle")} />
              <Card.Content style={layout.listCardContent}>
                {paymentSuggestions.length === 0 && (
                  <Text variant="bodyMedium" style={styles.listEmptyText}>
                    {t("expenses.noOpenPayments")}
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
                          title={`${getMemberLabel(suggestion.fromUser)} ${
                            t("expenses.paysLabel")
                          } ${suggestion.amount.toFixed(2)} €`}
                          description={`${t("expenses.toLabel")} ${getMemberLabel(
                            suggestion.toUser
                          )}`}
                          left={(props) => <List.Icon {...props} icon="cash-fast" />}
                          right={() => (
                            <Button
                              mode="text"
                              onPress={() => openSettlementFromSuggestion(suggestion)}
                            >
                              {t("expenses.paidAction")}
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
                  onPress={() => setSettlementDialogVisible(true)}
                  style={styles.paymentManualButton}
                >
                  {t("expenses.addSettlementManuallyButton")}
                </Button>
              </Card.Content>
            </Card>
          </View>

          <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
            <Card style={[layout.card, layout.twoColumnCard]}>
              <Card.Title
                title={t("expenses.lastExpensesTitle")}
                subtitle={isLoadingRecurring ? t("common.loading") : undefined}
              />
              <Card.Content style={layout.listCardContent}>
                {expenses.length === 0 && (
                  <Text variant="bodyMedium" style={styles.listEmptyText}>
                    {t("expenses.noExpensesYet")}
                  </Text>
                )}

                {expenses.length > 0 && (
                  <ScrollView nestedScrollEnabled style={!isWide && styles.mobileCardList}>
                    {expenses.map((expense) => (
                      <View key={expense.id}>
                        <List.Item
                          title={() => (
                            <View style={styles.expenseTitleRow}>
                              <Text variant="titleMedium" style={styles.expenseTitleText}>
                                {expense.description}: {expense.amount.toFixed(2)} €
                              </Text>
                              {expense.recurringExpense ? (
                                <Text variant="labelSmall" style={styles.generatedBadge}>
                                  {t("expenses.recurringGeneratedBadge")}
                                </Text>
                              ) : null}
                            </View>
                          )}
                          description={getExpenseSplitDescription(expense)}
                          left={(props) => (
                            <List.Icon
                              {...props}
                              icon={expense.recurringExpense ? "autorenew" : "receipt"}
                            />
                          )}
                          right={() => (
                            <View>
                              <Button mode="text" onPress={() => openEditExpense(expense)}>
                                {t("expenses.editButton")}
                              </Button>
                              <Button
                                mode="text"
                                onPress={async () => {
                                  await deleteExpense(expense.id);
                                  await reload();
                                }}
                              >
                                {t("expenses.deleteButton")}
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
                title={t("expenses.recurringListTitle")}
                subtitle={isLoadingRecurring ? t("common.loading") : undefined}
              />
              <Card.Content style={layout.listCardContent}>
                {didRecurringLoadFail && (
                  <View style={styles.recurringStatusBlock}>
                    <Text variant="bodyMedium">{t("expenses.recurringLoadFailed")}</Text>
                    <Button mode="outlined" onPress={() => void reload()}>
                      {t("expenses.recurringRetryButton")}
                    </Button>
                  </View>
                )}

                {!didRecurringLoadFail && recurringExpenses.length === 0 && (
                  <Text variant="bodyMedium" style={styles.listEmptyText}>
                    {t("expenses.noRecurringYet")}
                  </Text>
                )}

                {!didRecurringLoadFail && recurringExpenses.length > 0 && (
                  <ScrollView nestedScrollEnabled style={!isWide && styles.mobileCardList}>
                    {recurringExpenses.map((expense) => (
                      <View key={expense.id}>
                        <List.Item
                          title={`${expense.description}: ${expense.amount.toFixed(2)} €`}
                          description={getRecurringDescription(expense)}
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

          <Card style={layout.card}>
            <Card.Title title={t("expenses.settlementsTitle")} />
            <Card.Content style={layout.listCardContent}>
              {settlements.length === 0 && (
                <Text variant="bodyMedium" style={styles.listEmptyText}>
                  {t("expenses.noSettlementsYet")}
                </Text>
              )}

              {settlements.length > 0 && (
                <ScrollView nestedScrollEnabled style={!isWide && styles.mobileCardList}>
                  {settlements.map((settlement) => (
                    <View key={settlement.id}>
                      <List.Item
                        title={`${getMemberLabel(settlement.fromUser)} ${
                          t("expenses.paidAction")
                        } ${settlement.amount.toFixed(2)} €`}
                        description={`${t("expenses.toLabel")} ${getMemberLabel(
                          settlement.toUser
                        )}`}
                        left={(props) => <List.Icon {...props} icon="bank-transfer" />}
                        right={() => (
                          <Button
                            mode="text"
                            onPress={async () => {
                              await deleteSettlement(settlement.id);
                              await reload();
                            }}
                          >
                            {t("expenses.deleteButton")}
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
        </View>
      </View>

      <Portal>
        <Dialog visible={payerDialogVisible} onDismiss={() => setPayerDialogVisible(false)}>
          <Dialog.Title>{t("expenses.whoPaidTitle")}</Dialog.Title>
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
              {t("expenses.applyButton")}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={recurringPayerDialogVisible}
          onDismiss={() => setRecurringPayerDialogVisible(false)}
        >
          <Dialog.Title>{t("expenses.whoPaidTitle")}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <RadioButton.Group
                onValueChange={(value) => setRecurringPaidBy(value)}
                value={recurringPaidBy ?? ""}
              >
                {members.map((member) => (
                  <RadioButton.Item
                    key={`recurring-paid-${member.userId}`}
                    label={member.name || member.email}
                    value={member.userId}
                  />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setRecurringPayerDialogVisible(false)}>
              {t("expenses.applyButton")}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={splitDialogVisible} onDismiss={() => setSplitDialogVisible(false)}>
          <Dialog.Title>{t("expenses.whoSharesTitle")}</Dialog.Title>
          <Dialog.Content>
            <View style={styles.inlineActionRow}>
              <Button mode="outlined" onPress={selectAllMembers}>
                {t("expenses.allButton")}
              </Button>
              <Button mode="outlined" onPress={clearSelectedMembers}>
                {t("common.none")}
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.ScrollArea>
            <ScrollView>
              {members.map((member) => (
                <Checkbox.Item
                  key={member.userId}
                  label={member.name || member.email}
                  status={splitBetween.includes(member.userId) ? "checked" : "unchecked"}
                  onPress={() => toggleSplitMember(member.userId)}
                />
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setSplitDialogVisible(false)}>
              {t("expenses.applyButton")}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={recurringSplitDialogVisible}
          onDismiss={() => setRecurringSplitDialogVisible(false)}
        >
          <Dialog.Title>{t("expenses.whoSharesTitle")}</Dialog.Title>
          <Dialog.Content>
            <View style={styles.inlineActionRow}>
              <Button mode="outlined" onPress={selectAllRecurringMembers}>
                {t("expenses.allButton")}
              </Button>
              <Button mode="outlined" onPress={clearSelectedRecurringMembers}>
                {t("common.none")}
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.ScrollArea>
            <ScrollView>
              {members.map((member) => (
                <Checkbox.Item
                  key={`recurring-split-${member.userId}`}
                  label={member.name || member.email}
                  status={
                    recurringSplitBetween.includes(member.userId)
                      ? "checked"
                      : "unchecked"
                  }
                  onPress={() => toggleRecurringSplitMember(member.userId)}
                />
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setRecurringSplitDialogVisible(false)}>
              {t("expenses.applyButton")}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={editingExpense !== null}
          onDismiss={() => setEditingExpense(null)}
          style={styles.mobileDialog}
        >
          <Dialog.Title>{t("expenses.editButton")}</Dialog.Title>
          <Dialog.ScrollArea style={styles.editDialogScrollArea}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.editDialogContent}
            >
              <TextInput
                label={t("expenses.descriptionLabel")}
                value={editDescription}
                onChangeText={setEditDescription}
                mode="outlined"
                style={styles.dialogField}
              />

              <TextInput
                label={t("expenses.amountLabel")}
                value={editAmountText}
                onChangeText={setEditAmountText}
                keyboardType="decimal-pad"
                mode="outlined"
                style={styles.dialogField}
              />

              <TextInput
                label={t("expenses.noteLabel")}
                value={editNotes}
                onChangeText={setEditNotes}
                mode="outlined"
                multiline
                style={styles.dialogField}
              />

              <Text variant="titleMedium" style={styles.dialogLabel}>
                {t("expenses.paidByLabel")}
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

              <Text variant="titleMedium" style={styles.dialogLabel}>
                {t("expenses.splitBetweenLabel")}
              </Text>

              <View style={styles.inlineActionRow}>
                <Button mode="outlined" onPress={selectAllEditMembers}>
                  {t("expenses.allButton")}
                </Button>
                <Button mode="outlined" onPress={clearSelectedEditMembers}>
                  {t("common.none")}
                </Button>
              </View>

              {members.map((member) => (
                <Checkbox.Item
                  key={`edit-split-${member.userId}`}
                  label={member.name || member.email}
                  status={
                    editSplitBetween.includes(member.userId) ? "checked" : "unchecked"
                  }
                  onPress={() => toggleEditSplitMember(member.userId)}
                />
              ))}

              <SegmentedButtons
                value={editSplitMode}
                onValueChange={(value) => setEditSplitMode(value as SplitMode)}
                buttons={[
                  { value: "equal", label: t("expenses.splitModeEqual") },
                  { value: "amount", label: t("expenses.splitModeAmount") },
                  { value: "percent", label: "%" },
                ]}
                style={styles.editModeButtons}
              />

              {editSplitMode !== "equal" && (
                <View style={styles.editShareFields}>
                  {editSplitBetween.map((userId) => (
                    <TextInput
                      key={`edit-share-${userId}`}
                      label={`${getMemberLabel(userId)} ${
                        editSplitMode === "percent" ? "%" : "€"
                      }`}
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
            <Button onPress={() => setEditingExpense(null)}>
              {t("expenses.cancelButton")}
            </Button>
            <Button onPress={() => void saveEditedExpense()}>{t("expenses.saveButton")}</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={settlementDialogVisible}
          onDismiss={() => setSettlementDialogVisible(false)}
        >
          <Dialog.Title>{t("expenses.settlementTitle")}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <Text variant="titleMedium" style={styles.dialogLabel}>
                {t("expenses.fromLabel")}
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

              <Text variant="titleMedium" style={styles.dialogLabel}>
                {t("expenses.toLabel")}
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
                label={t("expenses.amountLabel")}
                value={settlementAmountText}
                onChangeText={setSettlementAmountText}
                keyboardType="decimal-pad"
                mode="outlined"
                style={styles.settlementAmountField}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setSettlementDialogVisible(false)}>
              {t("expenses.cancelButton")}
            </Button>
            <Button onPress={() => void addSettlement()}>{t("expenses.saveButton")}</Button>
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
  listEmptyText: {
    paddingHorizontal: 16,
  },
  intervalRow: {
    gap: 12,
  },
  intervalCountField: {
    minWidth: 120,
  },
  intervalUnitButtons: {
    flexShrink: 1,
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
  inlineActionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  recurringStatusBlock: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
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
