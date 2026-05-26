import { pb } from "./pocketbase";

export type Expense = {
  id: string;
  household: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  createdBy?: string;
};

export type Settlement = {
  id: string;
  household: string;
  fromUser: string;
  toUser: string;
  amount: number;
  createdBy?: string;
};

export type Balance = {
  userId: string;
  amount: number;
};

export type PaymentSuggestion = {
  fromUser: string;
  toUser: string;
  amount: number;
};

export async function loadExpenses(householdId: string): Promise<Expense[]> {
  return await pb.collection("expenses").getFullList<Expense>({
    filter: `household = "${householdId}"`,
    sort: "-created",
  });
}

export async function createExpense(input: {
  householdId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
}) {
  return await pb.collection("expenses").create({
    household: input.householdId,
    description: input.description,
    amount: input.amount,
    paidBy: input.paidBy,
    splitBetween: input.splitBetween,
    createdBy: pb.authStore.model?.id,
  });
}

export async function deleteExpense(expenseId: string) {
  return await pb.collection("expenses").delete(expenseId);
}

export async function loadSettlements(
  householdId: string
): Promise<Settlement[]> {
  return await pb.collection("settlements").getFullList<Settlement>({
    filter: `household = "${householdId}"`,
    sort: "-created",
  });
}

export async function createSettlement(input: {
  householdId: string;
  fromUser: string;
  toUser: string;
  amount: number;
}) {
  return await pb.collection("settlements").create({
    household: input.householdId,
    fromUser: input.fromUser,
    toUser: input.toUser,
    amount: input.amount,
    createdBy: pb.authStore.model?.id,
  });
}

export async function deleteSettlement(settlementId: string) {
  return await pb.collection("settlements").delete(settlementId);
}

export function calculateBalances(input: {
  expenses: Expense[];
  settlements: Settlement[];
}): Balance[] {
  const balances = new Map<string, number>();

  function add(userId: string, amount: number) {
    balances.set(userId, (balances.get(userId) ?? 0) + amount);
  }

  for (const expense of input.expenses) {
    const participants = expense.splitBetween ?? [];

    if (participants.length === 0) {
      continue;
    }

    const share = expense.amount / participants.length;

    for (const userId of participants) {
      add(userId, -share);
    }

    add(expense.paidBy, expense.amount);
  }

  for (const settlement of input.settlements) {
    // fromUser paid money to toUser.
    // That reduces fromUser's debt and reduces toUser's credit.
    add(settlement.fromUser, settlement.amount);
    add(settlement.toUser, -settlement.amount);
  }

  return Array.from(balances.entries())
    .map(([userId, amount]) => ({
      userId,
      amount,
    }))
    .filter((balance) => Math.abs(balance.amount) >= 0.005)
    .sort((a, b) => b.amount - a.amount);
}

export function suggestPayments(balances: Balance[]): PaymentSuggestion[] {
  const debtors = balances
    .filter((balance) => balance.amount < -0.005)
    .map((balance) => ({
      userId: balance.userId,
      amount: -balance.amount,
    }));

  const creditors = balances
    .filter((balance) => balance.amount > 0.005)
    .map((balance) => ({
      userId: balance.userId,
      amount: balance.amount,
    }));

  const suggestions: PaymentSuggestion[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    const amount = Math.min(debtor.amount, creditor.amount);

    suggestions.push({
      fromUser: debtor.userId,
      toUser: creditor.userId,
      amount,
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.005) {
      debtorIndex += 1;
    }

    if (creditor.amount < 0.005) {
      creditorIndex += 1;
    }
  }

  return suggestions;
}