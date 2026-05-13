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

export type Balance = {
  userId: string;
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

export function calculateBalances(expenses: Expense[]): Balance[] {
  const balances = new Map<string, number>();

  for (const expense of expenses) {
    const participants = expense.splitBetween ?? [];

    if (participants.length === 0) {
      continue;
    }

    const share = expense.amount / participants.length;

    for (const userId of participants) {
      balances.set(userId, (balances.get(userId) ?? 0) - share);
    }

    balances.set(
      expense.paidBy,
      (balances.get(expense.paidBy) ?? 0) + expense.amount
    );
  }

  return Array.from(balances.entries()).map(([userId, amount]) => ({
    userId,
    amount,
  }));
}