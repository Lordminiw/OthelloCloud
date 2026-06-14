import { useCallback, useEffect, useMemo, useState } from "react";
import { useWindowDimensions } from "react-native";
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
} from "../../lib/expenses";
import { HouseholdMember, loadHouseholdMembers } from "../../lib/members";
import { pb } from "../../lib/pocketbase";
import {
  buildRecurringExpensePayload,
  createRecurringExpense,
  loadRecurringExpenses,
  RecurringExpense,
  RecurringExpenseValidationField,
  RecurringIntervalUnit,
  validateRecurringExpenseInput,
} from "../../lib/recurring-expenses";

type SplitShareSource = {
  splitBetween?: string[];
  splitShares?: string;
};

type PaymentSuggestion = {
  fromUser: string;
  toUser: string;
  amount: number;
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

export function useExpensesScreen(householdId: string) {
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
  const [isRecurringExpense, setIsRecurringExpense] = useState(false);
  const [recurringStartDate, setRecurringStartDate] = useState(getTodayDateInput());
  const [recurringIntervalCountText, setRecurringIntervalCountText] = useState("1");
  const [recurringIntervalUnit, setRecurringIntervalUnit] =
    useState<RecurringIntervalUnit>("month");

  const [payerDialogVisible, setPayerDialogVisible] = useState(false);
  const [splitDialogVisible, setSplitDialogVisible] = useState(false);
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

  function getRecurringValidationMessage(field: RecurringExpenseValidationField) {
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

  function resetExpenseForm(defaultPayer: string | null) {
    setDescription("");
    setAmountText("");
    setNotes("");
    setSplitMode("equal");
    setSplitSharesText({});
    setPaidBy(defaultPayer);
    setSplitBetween(members.map((member) => member.userId));
    setIsRecurringExpense(false);
    setRecurringStartDate(getTodayDateInput());
    setRecurringIntervalCountText("1");
    setRecurringIntervalUnit("month");
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
      if (isRecurringExpense) {
        const validation = validateRecurringExpenseInput({
          householdId,
          description,
          amountText,
          paidBy,
          splitBetween,
          splitMode,
          splitShares,
          notes,
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
        await createRecurringExpense(
          buildRecurringExpensePayload({
            householdId,
            description,
            amountText,
            paidBy,
            splitBetween,
            splitMode,
            splitShares,
            notes,
            startDate: recurringStartDate,
            intervalUnit: recurringIntervalUnit,
            intervalCountText: recurringIntervalCountText,
            active: true,
          })
        );
      } else {
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
      }

      resetExpenseForm(currentUserId ?? paidBy);

      await reload();
      if (isRecurringExpense) {
        alert(t("expenses.recurringCreateSuccess"));
      }
    } catch (error: any) {
      console.log("ADD EXPENSE ERROR:", error);
      console.log("RESPONSE:", error?.response);
      alert(JSON.stringify(error?.response, null, 2));
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

  function openSettlementFromSuggestion(suggestion: PaymentSuggestion) {
    setSettlementFromUser(suggestion.fromUser);
    setSettlementToUser(suggestion.toUser);
    setSettlementAmountText(suggestion.amount.toFixed(2));
    setSettlementDialogVisible(true);
  }

  async function deleteExpenseById(expenseId: string) {
    await deleteExpense(expenseId);
    await reload();
  }

  async function deleteSettlementById(settlementId: string) {
    await deleteSettlement(settlementId);
    await reload();
  }

  const balances = calculateBalances({
    expenses,
    settlements,
  });
  const paymentSuggestions = suggestPayments(balances);

  return {
    t,
    isWide,
    reload,
    expenses,
    settlements,
    members,
    recurringExpenses,
    isLoadingRecurring,
    isCreatingRecurring,
    didRecurringLoadFail,
    description,
    setDescription,
    amountText,
    setAmountText,
    notes,
    setNotes,
    paidBy,
    setPaidBy,
    splitBetween,
    splitMode,
    setSplitMode,
    splitSharesText,
    isRecurringExpense,
    setIsRecurringExpense,
    recurringStartDate,
    setRecurringStartDate,
    recurringIntervalCountText,
    setRecurringIntervalCountText,
    recurringIntervalUnit,
    setRecurringIntervalUnit,
    payerDialogVisible,
    setPayerDialogVisible,
    splitDialogVisible,
    setSplitDialogVisible,
    settlementDialogVisible,
    setSettlementDialogVisible,
    settlementFromUser,
    setSettlementFromUser,
    settlementToUser,
    setSettlementToUser,
    settlementAmountText,
    setSettlementAmountText,
    editingExpense,
    setEditingExpense,
    editDescription,
    setEditDescription,
    editAmountText,
    setEditAmountText,
    editNotes,
    setEditNotes,
    editPaidBy,
    setEditPaidBy,
    editSplitBetween,
    editSplitMode,
    setEditSplitMode,
    editSplitSharesText,
    balances,
    paymentSuggestions,
    getMemberLabel,
    getExpenseSplitDescription,
    getRecurringDescription,
    toggleSplitMember,
    toggleEditSplitMember,
    selectAllMembers,
    clearSelectedMembers,
    selectAllEditMembers,
    clearSelectedEditMembers,
    updateSplitShare,
    updateEditSplitShare,
    addExpense,
    addSettlement,
    saveEditedExpense,
    openEditExpense,
    openSettlementFromSuggestion,
    deleteExpenseById,
    deleteSettlementById,
  };
}

export type ExpensesScreenViewModel = ReturnType<typeof useExpensesScreen>;
