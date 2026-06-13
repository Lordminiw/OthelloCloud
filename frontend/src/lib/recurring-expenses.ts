import type { SplitMode } from "./expenses";
import { pb } from "./pocketbase";

export type RecurringIntervalUnit = "day" | "week" | "month" | "year";

export type RecurringExpense = {
  id: string;
  household: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  splitMode?: SplitMode;
  splitShares?: string;
  notes?: string;
  startDate: string;
  intervalUnit: RecurringIntervalUnit;
  intervalCount: number;
  nextRunAt?: string;
  lastRunAt?: string;
  active: boolean;
  createdBy?: string;
  lastError?: string;
  lastGeneratedExpense?: string;
  created?: string;
  updated?: string;
};

export type RecurringExpenseFormInput = {
  householdId: string;
  description: string;
  amountText: string;
  paidBy: string;
  splitBetween: string[];
  splitMode?: SplitMode;
  splitShares?: Record<string, number>;
  notes?: string;
  startDate: string;
  intervalUnit: string;
  intervalCountText: string;
  active?: boolean;
};

export type RecurringExpenseValidationField =
  | "description"
  | "amount"
  | "paidBy"
  | "splitBetween"
  | "splitMode"
  | "splitShares"
  | "startDate"
  | "intervalUnit"
  | "intervalCount";

export type RecurringExpenseValidationResult = {
  errors: RecurringExpenseValidationField[];
};

export type RecurringExpensePayload = {
  household: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  splitMode: SplitMode;
  splitShares: string;
  notes: string;
  startDate: string;
  intervalUnit: RecurringIntervalUnit;
  intervalCount: number;
  active: boolean;
};

const RECURRING_INTERVAL_UNITS: RecurringIntervalUnit[] = [
  "day",
  "week",
  "month",
  "year",
];
const RECURRING_SPLIT_MODES: SplitMode[] = ["equal", "amount", "percent"];
const RECURRING_SHARE_TOLERANCE = 0.005;

export function validateRecurringExpenseInput(
  input: Partial<RecurringExpenseFormInput>
): RecurringExpenseValidationResult {
  const errors: RecurringExpenseValidationField[] = [];

  const amount = Number(normalizeNumericText(input.amountText ?? ""));
  const paidBy = String(input.paidBy ?? "").trim();
  const splitBetween = Array.isArray(input.splitBetween)
    ? input.splitBetween.filter((memberId) => String(memberId ?? "").trim())
    : [];
  const splitMode = normalizeSplitMode(input.splitMode);

  if (!String(input.description ?? "").trim()) {
    errors.push("description");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("amount");
  }

  if (!paidBy) {
    errors.push("paidBy");
  }

  if (splitBetween.length === 0) {
    errors.push("splitBetween");
  }

  if (!splitMode) {
    errors.push("splitMode");
  }

  if (!isValidRecurringStartDate(input.startDate)) {
    errors.push("startDate");
  }

  if (!isRecurringIntervalUnit(input.intervalUnit)) {
    errors.push("intervalUnit");
  }

  const intervalCount = Number(String(input.intervalCountText ?? "").trim());
  if (!Number.isInteger(intervalCount) || intervalCount < 1) {
    errors.push("intervalCount");
  }

  if (
    splitBetween.length > 0 &&
    splitMode &&
    splitMode !== "equal" &&
    !hasConsistentSplitShares({
      amount,
      splitBetween,
      splitMode,
      splitShares: input.splitShares,
    })
  ) {
    errors.push("splitShares");
  }

  return { errors };
}

export function buildRecurringExpensePayload(
  input: RecurringExpenseFormInput
): RecurringExpensePayload {
  const validation = validateRecurringExpenseInput(input);
  if (validation.errors.length > 0) {
    throw new Error(
      `Invalid recurring expense input: ${validation.errors.join(", ")}`
    );
  }

  const splitMode = normalizeSplitMode(input.splitMode) ?? "equal";
  const splitBetween = normalizeSplitBetween(input.splitBetween);
  const splitShares = buildNormalizedSplitShares({
    amount: Number(normalizeNumericText(input.amountText)),
    splitBetween,
    splitMode,
    splitShares: input.splitShares,
  });

  if (splitShares === null) {
    throw new Error("Invalid recurring expense input: splitShares");
  }

  return {
    household: input.householdId,
    description: String(input.description).trim(),
    amount: Number(normalizeNumericText(input.amountText)),
    paidBy: String(input.paidBy).trim(),
    splitBetween,
    splitMode,
    splitShares,
    notes: String(input.notes ?? "").trim(),
    startDate: String(input.startDate).trim(),
    intervalUnit: normalizeIntervalUnit(input.intervalUnit),
    intervalCount: Number(String(input.intervalCountText).trim()),
    active: input.active ?? true,
  };
}

export async function loadRecurringExpenses(
  householdId: string
): Promise<RecurringExpense[]> {
  return await pb.collection("recurring_expenses").getFullList<RecurringExpense>({
    filter: `household = "${householdId}"`,
    sort: "description",
  });
}

export async function createRecurringExpense(input: RecurringExpensePayload) {
  return await pb.collection("recurring_expenses").create<RecurringExpense>(input);
}

export async function updateRecurringExpense(
  id: string,
  input: RecurringExpensePayload
) {
  return await pb
    .collection("recurring_expenses")
    .update<RecurringExpense>(id, input);
}

export async function deleteRecurringExpense(id: string) {
  return await pb.collection("recurring_expenses").delete(id);
}

function isRecurringIntervalUnit(
  value: string | undefined
): value is RecurringIntervalUnit {
  return RECURRING_INTERVAL_UNITS.includes(
    String(value ?? "").trim() as RecurringIntervalUnit
  );
}

function normalizeIntervalUnit(value: string): RecurringIntervalUnit {
  return String(value).trim() as RecurringIntervalUnit;
}

function normalizeNumericText(value: string) {
  return String(value).trim().replace(",", ".");
}

function isValidRecurringStartDate(value: string | undefined) {
  const startDate = String(value ?? "").trim();

  if (!startDate) {
    return false;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const date = new Date(year, month - 1, day);

    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  return Number.isFinite(Date.parse(startDate));
}

function normalizeSplitMode(value: SplitMode | undefined) {
  const splitMode = String(value ?? "").trim();
  return RECURRING_SPLIT_MODES.includes(splitMode as SplitMode)
    ? (splitMode as SplitMode)
    : splitMode === ""
      ? "equal"
      : null;
}

function normalizeSplitBetween(splitBetween: string[] | undefined) {
  return Array.isArray(splitBetween)
    ? splitBetween.map((memberId) => String(memberId).trim()).filter(Boolean)
    : [];
}

function hasConsistentSplitShares(input: {
  amount: number;
  splitBetween: string[];
  splitMode: Exclude<SplitMode, "equal">;
  splitShares: RecurringExpenseFormInput["splitShares"];
}) {
  return buildNormalizedSplitShares(input) !== null;
}

function buildNormalizedSplitShares(input: {
  amount: number;
  splitBetween: string[];
  splitMode: SplitMode;
  splitShares: RecurringExpenseFormInput["splitShares"];
}) {
  if (input.splitMode === "equal") {
    return "";
  }

  if (!input.splitShares || typeof input.splitShares !== "object") {
    return null;
  }

  const normalizedShares: Record<string, number> = {};
  let total = 0;

  for (const memberId of input.splitBetween) {
    if (!Object.prototype.hasOwnProperty.call(input.splitShares, memberId)) {
      return null;
    }

    const share = Number(input.splitShares[memberId]);
    if (!Number.isFinite(share) || share < 0) {
      return null;
    }

    normalizedShares[memberId] = share;
    total += share;
  }

  if (
    input.splitMode === "amount" &&
    Math.abs(total - input.amount) >= RECURRING_SHARE_TOLERANCE
  ) {
    return null;
  }

  if (
    input.splitMode === "percent" &&
    Math.abs(total - 100) >= RECURRING_SHARE_TOLERANCE
  ) {
    return null;
  }

  return JSON.stringify(normalizedShares);
}
