import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";
import { ExpensesScreen } from "../ExpensesScreen";
import {
  createExpense,
  createSettlement,
  deleteExpense,
  deleteSettlement,
  loadExpenses,
  loadSettlements,
  updateExpense,
} from "../../lib/expenses";
import { loadHouseholdMembers } from "../../lib/members";
import {
  createRecurringExpense,
  loadRecurringExpenses,
} from "../../lib/recurring-expenses";

jest.mock("@/components/app-screen", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text, View } = require("react-native");

  return {
    AppScreen: ({ title, right, children }: any) => (
      <View>
        <Text>{title}</Text>
        {right}
        <View>{children}</View>
      </View>
    ),
    layout: {
      stack: {},
      sectionGrid: {},
      wideRow: {},
      wideForm: {},
      widePanel: {},
      twoColumnCard: {},
      card: {},
      listCardContent: {},
      formContent: {},
      inlineActions: {},
    },
  };
});

jest.mock("@/components/household-dropdown", () => ({
  HouseholdDropdown: () => null,
}));

jest.mock("react-native-paper", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text, TextInput, View } = require("react-native");

  const Button = ({ children, onPress, disabled, testID }: any) => (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} testID={testID}>
      <Text>{children}</Text>
    </Pressable>
  );

  const CheckboxItem = ({ label, onPress, status, testID }: any) => (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: status === "checked" }}
      onPress={onPress}
      testID={testID}
    >
      <Text>{label}</Text>
    </Pressable>
  );

  const Dialog = ({ children, visible }: any) => (visible ? <View>{children}</View> : null);
  Dialog.Title = function DialogTitle({ children }: any) {
    return <Text>{children}</Text>;
  };
  Dialog.Content = function DialogContent({ children }: any) {
    return <View>{children}</View>;
  };
  Dialog.ScrollArea = function DialogScrollArea({ children }: any) {
    return <View>{children}</View>;
  };
  Dialog.Actions = function DialogActions({ children }: any) {
    return <View>{children}</View>;
  };

  const ListItem = ({ title, description, left, right }: any) => (
    <View>
      {left ? left({}) : null}
      {typeof title === "function" ? title() : <Text>{title}</Text>}
      {description ? <Text>{description}</Text> : null}
      {right ? right({}) : null}
    </View>
  );

  const RadioButtonGroup = function RadioButtonGroup({ children }: any) {
    return <View>{children}</View>;
  };
  const RadioButtonItem = function RadioButtonItem({ label, value, onPress }: any) {
    return (
      <Pressable accessibilityRole="radio" onPress={() => onPress?.(value)}>
        <Text>{label}</Text>
      </Pressable>
    );
  };

  const SegmentedButtons = ({ buttons, onValueChange }: any) => (
    <View>
      {buttons.map((button: any) => (
        <Pressable
          key={button.value}
          accessibilityRole="button"
          onPress={() => onValueChange(button.value)}
        >
          <Text>{button.label}</Text>
        </Pressable>
      ))}
    </View>
  );

  const PaperTextInput = ({ label, onChangeText, placeholder, testID, value }: any) => (
    <TextInput
      accessibilityLabel={label}
      onChangeText={onChangeText}
      placeholder={placeholder}
      testID={testID}
      value={value}
    />
  );

  const Card = ({ children }: any) => <View>{children}</View>;
  Card.Title = function CardTitle({ title, subtitle }: any) {
    return (
      <View>
        <Text>{title}</Text>
        {subtitle ? <Text>{subtitle}</Text> : null}
      </View>
    );
  };
  Card.Content = function CardContent({ children }: any) {
    return <View>{children}</View>;
  };

  const List = {
    Icon: () => null,
    Item: ListItem,
  };

  const RadioButton = {
    Group: RadioButtonGroup,
    Item: RadioButtonItem,
  };

  return {
    Button,
    Card,
    Checkbox: { Item: CheckboxItem },
    Dialog,
    Divider: () => <View />,
    List,
    Portal: ({ children }: any) => <View>{children}</View>,
    RadioButton,
    SegmentedButtons,
    Text,
    TextInput: PaperTextInput,
  };
});

jest.mock("../../lib/expenses", () => ({
  calculateBalances: jest.fn(() => []),
  createExpense: jest.fn(),
  createSettlement: jest.fn(),
  deleteExpense: jest.fn(),
  deleteSettlement: jest.fn(),
  loadExpenses: jest.fn(),
  loadSettlements: jest.fn(),
  suggestPayments: jest.fn(() => []),
  updateExpense: jest.fn(),
}));

jest.mock("../../lib/members", () => ({
  loadHouseholdMembers: jest.fn(),
}));

jest.mock("../../lib/recurring-expenses", () => {
  const actual = jest.requireActual("../../lib/recurring-expenses");

  return {
    ...actual,
    createRecurringExpense: jest.fn(),
    loadRecurringExpenses: jest.fn(),
  };
});

const mockLoadExpenses = jest.mocked(loadExpenses);
const mockLoadSettlements = jest.mocked(loadSettlements);
const mockLoadHouseholdMembers = jest.mocked(loadHouseholdMembers);
const mockLoadRecurringExpenses = jest.mocked(loadRecurringExpenses);
const mockCreateRecurringExpense = jest.mocked(createRecurringExpense);
const mockCreateExpense = jest.mocked(createExpense);
const mockUpdateExpense = jest.mocked(updateExpense);
const mockDeleteExpense = jest.mocked(deleteExpense);
const mockCreateSettlement = jest.mocked(createSettlement);
const mockDeleteSettlement = jest.mocked(deleteSettlement);
let consoleLogSpy: jest.SpyInstance;

function renderScreen() {
  return render(<ExpensesScreen householdId="house-1" />);
}

beforeEach(() => {
  jest.clearAllMocks();
  consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  mockLoadExpenses.mockResolvedValue([]);
  mockLoadSettlements.mockResolvedValue([]);
  mockLoadHouseholdMembers.mockResolvedValue([
    { id: "m1", userId: "user-1", email: "one@example.com", name: "One", role: "admin" },
    { id: "m2", userId: "user-2", email: "two@example.com", name: "Two", role: "member" },
  ]);
  mockLoadRecurringExpenses.mockResolvedValue([]);
  mockCreateRecurringExpense.mockResolvedValue({ id: "rule-1" } as any);
  mockCreateExpense.mockResolvedValue({} as any);
  mockUpdateExpense.mockResolvedValue({} as any);
  mockDeleteExpense.mockResolvedValue(true as any);
  mockCreateSettlement.mockResolvedValue({} as any);
  mockDeleteSettlement.mockResolvedValue(true as any);
});

afterEach(() => {
  consoleLogSpy.mockRestore();
});

describe("ExpensesScreen recurring expenses", () => {
  it("reveals recurring fields from the main expense form when recurring is enabled", async () => {
    renderScreen();

    await waitFor(() =>
      expect(screen.getByText("No recurring expenses yet.")).toBeTruthy()
    );

    expect(screen.queryByTestId("recurring-start-date-input")).toBeNull();
    expect(screen.queryByDisplayValue("Add recurring expense")).toBeNull();

    fireEvent.press(screen.getByTestId("expense-recurring-toggle"));

    expect(screen.getByTestId("recurring-start-date-input")).toBeTruthy();
    expect(screen.getByTestId("recurring-interval-count-input")).toBeTruthy();
    expect(screen.getByTestId("expense-submit-button")).toBeTruthy();
  });

  it("creates a normal expense when recurring is left disabled", async () => {
    renderScreen();

    await waitFor(() =>
      expect(screen.getByText("No recurring expenses yet.")).toBeTruthy()
    );

    fireEvent.changeText(screen.getByTestId("expense-description-input"), "Groceries");
    fireEvent.changeText(screen.getByTestId("expense-amount-input"), "14.20");
    fireEvent.press(screen.getByTestId("expense-submit-button"));

    await waitFor(() => expect(mockCreateExpense).toHaveBeenCalledTimes(1));
    expect(mockCreateRecurringExpense).not.toHaveBeenCalled();
  });

  it("creates a recurring rule from the main expense form when recurring is enabled", async () => {
    renderScreen();

    await waitFor(() =>
      expect(screen.getByText("No recurring expenses yet.")).toBeTruthy()
    );

    fireEvent.changeText(screen.getByTestId("expense-description-input"), "Internet");
    fireEvent.changeText(screen.getByTestId("expense-amount-input"), "29,99");
    fireEvent.press(screen.getByTestId("expense-recurring-toggle"));
    fireEvent.changeText(screen.getByTestId("recurring-start-date-input"), "2026-06-13");
    fireEvent.press(screen.getByTestId("expense-submit-button"));

    await waitFor(() => expect(mockCreateRecurringExpense).toHaveBeenCalledTimes(1));
    expect(mockCreateExpense).not.toHaveBeenCalled();
  });

  it("renders generated expense indicators and recurring rule details", async () => {
    mockLoadExpenses.mockResolvedValue([
      {
        id: "expense-1",
        household: "house-1",
        description: "Rent",
        amount: 650,
        paidBy: "user-1",
        splitBetween: ["user-1", "user-2"],
        splitMode: "equal",
        recurringExpense: "rule-1",
        scheduledFor: "2026-07-01",
      },
    ]);
    mockLoadRecurringExpenses.mockResolvedValue([
      {
        id: "rule-1",
        household: "house-1",
        description: "Rent",
        amount: 650,
        paidBy: "user-1",
        splitBetween: ["user-1", "user-2"],
        splitMode: "equal",
        startDate: "2026-06-01",
        intervalUnit: "month",
        intervalCount: 1,
        active: true,
        lastGeneratedExpense: "expense-1",
      },
    ]);

    renderScreen();

    await waitFor(() => expect(screen.getByText("Recurring rules")).toBeTruthy());

    expect(screen.getByText("Generated")).toBeTruthy();
    expect(screen.getByText(/From recurring rule: Rent/)).toBeTruthy();
    expect(screen.getByText(/Scheduled for:/)).toBeTruthy();
    expect(screen.getByText(/Last generated expense: Rent/)).toBeTruthy();
    expect(screen.getByText(/Every 1 Month\s+Active/)).toBeTruthy();
  });

  it("shows a dedicated recurring load failure state and retries it through screen reload", async () => {
    mockLoadRecurringExpenses
      .mockRejectedValueOnce(new Error("recurring load failed"))
      .mockResolvedValueOnce([]);

    renderScreen();

    await waitFor(() =>
      expect(
        screen.getByText("Recurring expenses could not be loaded right now.")
      ).toBeTruthy()
    );

    fireEvent.press(screen.getByText("Retry"));

    await waitFor(() => expect(mockLoadRecurringExpenses).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByText("No recurring expenses yet.")).toBeTruthy()
    );
  });
});
