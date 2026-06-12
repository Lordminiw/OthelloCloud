import {
  buildRecurringExpensePayload,
  type RecurringExpenseFormInput,
  validateRecurringExpenseInput,
} from "./recurring-expenses";

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

describe("validateRecurringExpenseInput", () => {
  it("rejects missing schedule fields", () => {
    const result = validateRecurringExpenseInput(
      createValidInput({
        description: "",
        startDate: "",
        intervalUnit: "",
        intervalCountText: "",
      })
    );

    expect(result.errors).toEqual([
      "description",
      "startDate",
      "intervalUnit",
      "intervalCount",
    ]);
  });

  it("rejects unsupported non-empty interval units", () => {
    const result = validateRecurringExpenseInput(
      createValidInput({
        intervalUnit: "quarter",
      })
    );

    expect(result.errors).toEqual(["intervalUnit"]);
  });

  it("rejects invalid non-empty start dates", () => {
    const result = validateRecurringExpenseInput(
      createValidInput({
        startDate: "not-a-date",
      })
    );

    expect(result.errors).toEqual(["startDate"]);
  });

  it("rejects impossible ISO calendar dates", () => {
    const result = validateRecurringExpenseInput(
      createValidInput({
        startDate: "2026-02-30",
      })
    );

    expect(result.errors).toEqual(["startDate"]);
  });

  it("rejects invalid expense template fields", () => {
    const result = validateRecurringExpenseInput(
      createValidInput({
        amountText: "0",
        paidBy: "   ",
        splitBetween: [],
        splitMode: "weird" as RecurringExpenseFormInput["splitMode"],
      })
    );

    expect(result.errors).toEqual([
      "amount",
      "paidBy",
      "splitBetween",
      "splitMode",
    ]);
  });

  it("rejects inconsistent percentage split shares", () => {
    const result = validateRecurringExpenseInput(
      createValidInput({
        splitMode: "percent",
        splitShares: { "user-1": 60 },
      })
    );

    expect(result.errors).toEqual(["splitShares"]);
  });

  it("rejects invalid amount split totals", () => {
    const result = validateRecurringExpenseInput(
      createValidInput({
        splitMode: "amount",
        splitShares: {
          "user-1": 300,
          "user-2": 200,
        },
      })
    );

    expect(result.errors).toEqual(["splitShares"]);
  });
});

describe("buildRecurringExpensePayload", () => {
  it("normalizes numeric fields and split shares", () => {
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

    expect(payload).toEqual({
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

  it("leaves splitShares empty when not provided", () => {
    const payload = buildRecurringExpensePayload(
      createValidInput({
        description: "Water",
        amountText: "18.50",
        splitBetween: ["user-1"],
        intervalUnit: "week",
        active: false,
      })
    );

    expect(payload.amount).toBe(18.5);
    expect(payload.intervalCount).toBe(1);
    expect(payload.splitShares).toBe("");
    expect(payload.active).toBe(false);
  });

  it("fails fast on invalid input", () => {
    expect(() =>
      buildRecurringExpensePayload(
        createValidInput({
          paidBy: "",
          splitMode: "percent",
          splitShares: { "user-1": 40, "user-2": 40 },
        })
      )
    ).toThrow(/paidBy|splitShares/);
  });
});
