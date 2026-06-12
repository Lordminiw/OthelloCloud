/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";

import type { RecurringExpenseFormInput } from "./recurring-expenses";

process.env.EXPO_PUBLIC_POCKETBASE_URL ??= "http://127.0.0.1:8090";

async function loadRecurringExpenseHelpers() {
  return await import("./recurring-expenses");
}

function createValidInput(
  overrides: Partial<RecurringExpenseFormInput> = {}
): RecurringExpenseFormInput {
  return {
    householdId: "house-1",
    description: "Rent",
    amountText: "650",
    paidBy: "user-1",
    splitBetween: ["user-1", "user-2"],
    splitMode: "equal",
    notes: "",
    startDate: "2026-06-12",
    intervalUnit: "month",
    intervalCountText: "1",
    active: true,
    ...overrides,
  };
}

test("validateRecurringExpenseInput rejects missing schedule fields", async () => {
  const { validateRecurringExpenseInput } = await loadRecurringExpenseHelpers();

  const result = validateRecurringExpenseInput(
    createValidInput({
      description: "",
      startDate: "",
      intervalUnit: "",
      intervalCountText: "",
    })
  );

  assert.deepEqual(result.errors, [
    "description",
    "startDate",
    "intervalUnit",
    "intervalCount",
  ]);
});

test("validateRecurringExpenseInput rejects unsupported non-empty interval units", async () => {
  const { validateRecurringExpenseInput } = await loadRecurringExpenseHelpers();

  const result = validateRecurringExpenseInput(
    createValidInput({
      intervalUnit: "quarter",
    })
  );

  assert.deepEqual(result.errors, ["intervalUnit"]);
});

test("validateRecurringExpenseInput rejects invalid non-empty start dates", async () => {
  const { validateRecurringExpenseInput } = await loadRecurringExpenseHelpers();

  const result = validateRecurringExpenseInput(
    createValidInput({
      startDate: "not-a-date",
    })
  );

  assert.deepEqual(result.errors, ["startDate"]);
});

test("validateRecurringExpenseInput rejects invalid expense template fields", async () => {
  const { validateRecurringExpenseInput } = await loadRecurringExpenseHelpers();

  const result = validateRecurringExpenseInput(
    createValidInput({
      amountText: "0",
      paidBy: "   ",
      splitBetween: [],
      splitMode: "weird" as RecurringExpenseFormInput["splitMode"],
    })
  );

  assert.deepEqual(result.errors, [
    "amount",
    "paidBy",
    "splitBetween",
    "splitMode",
  ]);
});

test("validateRecurringExpenseInput rejects inconsistent percentage split shares", async () => {
  const { validateRecurringExpenseInput } = await loadRecurringExpenseHelpers();

  const result = validateRecurringExpenseInput(
    createValidInput({
      splitMode: "percent",
      splitShares: { "user-1": 60 },
    })
  );

  assert.deepEqual(result.errors, ["splitShares"]);
});

test("validateRecurringExpenseInput rejects invalid amount split totals", async () => {
  const { validateRecurringExpenseInput } = await loadRecurringExpenseHelpers();

  const result = validateRecurringExpenseInput(
    createValidInput({
      splitMode: "amount",
      splitShares: {
        "user-1": 300,
        "user-2": 200,
      },
    })
  );

  assert.deepEqual(result.errors, ["splitShares"]);
});

test("buildRecurringExpensePayload normalizes numeric fields and split shares", async () => {
  const { buildRecurringExpensePayload } = await loadRecurringExpenseHelpers();

  const payload = buildRecurringExpensePayload(
    createValidInput({
      description: "  Internet  ",
      amountText: "29,99",
      splitMode: "percent",
      splitShares: { "user-1": 60, "user-2": 40 },
      notes: "  Paid automatically  ",
      intervalCountText: "2",
    })
  );

  assert.deepEqual(payload, {
    household: "house-1",
    description: "Internet",
    amount: 29.99,
    paidBy: "user-1",
    splitBetween: ["user-1", "user-2"],
    splitMode: "percent",
    splitShares: JSON.stringify({ "user-1": 60, "user-2": 40 }),
    notes: "Paid automatically",
    startDate: "2026-06-12",
    intervalUnit: "month",
    intervalCount: 2,
    active: true,
  });
});

test("buildRecurringExpensePayload leaves splitShares empty when not provided", async () => {
  const { buildRecurringExpensePayload } = await loadRecurringExpenseHelpers();

  const payload = buildRecurringExpensePayload(
    createValidInput({
      description: "Water",
      amountText: "18.50",
      splitBetween: ["user-1"],
      intervalUnit: "week",
      active: false,
    })
  );

  assert.equal(payload.amount, 18.5);
  assert.equal(payload.intervalCount, 1);
  assert.equal(payload.splitShares, "");
  assert.equal(payload.active, false);
});

test("buildRecurringExpensePayload fails fast on invalid input", async () => {
  const { buildRecurringExpensePayload } = await loadRecurringExpenseHelpers();

  assert.throws(
    () =>
      buildRecurringExpensePayload(
        createValidInput({
          paidBy: "",
          splitMode: "percent",
          splitShares: { "user-1": 40, "user-2": 40 },
        })
      ),
    (error: unknown) => {
      assert.match(String(error), /paidBy|splitShares/);
      return true;
    }
  );
});
