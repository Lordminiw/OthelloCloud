import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { CalendarDisplayDropdown } from "../calendar-display-dropdown";

const mockToggleHousehold = jest.fn();
const mockToggleSubscription = jest.fn();

jest.mock("@/context/household-context", () => ({
  useHousehold: () => ({
    households: [
      { id: "household-1", name: "Othello House" },
      { id: "household-2", name: "Second WG" },
    ],
  }),
}));

jest.mock("@/context/language-context", () => ({
  useLanguage: () => ({
    t: (key: string, args?: Record<string, number>) =>
      ({
        "calendar.selectedCalendars": `${args?.count ?? 0} calendars`,
        "calendar.householdCalendars": "Household calendars",
        "calendar.importedCalendars": "Imported calendars",
      })[key] ?? key,
  }),
}));

jest.mock("react-native-paper", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text, View } = require("react-native");

  const Button = ({ children, onPress, testID }: any) => (
    <Pressable accessibilityRole="button" onPress={onPress} testID={testID}>
      <Text>{children}</Text>
    </Pressable>
  );

  const Menu = ({ anchor, children, visible }: any) => (
    <View>
      {anchor}
      {visible ? <View>{children}</View> : null}
    </View>
  );

  function MenuItem({ title, onPress, disabled }: any) {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
      >
        <Text>{title}</Text>
      </Pressable>
    );
  }

  Menu.Item = MenuItem;

  return {
    Button,
    Menu,
  };
});

function renderDropdown() {
  return render(
    <CalendarDisplayDropdown
      subscriptions={[
        {
          id: "subscription-1",
          name: "Work calendar",
        } as any,
      ]}
      selectedHouseholdIds={["household-1"]}
      selectedSubscriptionIds={["subscription-1"]}
      onToggleHousehold={mockToggleHousehold}
      onToggleSubscription={mockToggleSubscription}
    />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

it("toggles calendar options when pressing the selector repeatedly", () => {
  renderDropdown();

  fireEvent.press(screen.getByText("2 calendars"));
  expect(screen.getByText("Household calendars")).toBeTruthy();

  fireEvent.press(screen.getByText("2 calendars"));
  expect(screen.queryByText("Household calendars")).toBeNull();

  fireEvent.press(screen.getByText("2 calendars"));
  expect(screen.getByText("Household calendars")).toBeTruthy();
});

it("keeps the menu open while toggling displayed calendars", () => {
  renderDropdown();

  fireEvent.press(screen.getByText("2 calendars"));
  fireEvent.press(screen.getByText("Second WG"));
  fireEvent.press(screen.getByText("Work calendar"));

  expect(mockToggleHousehold).toHaveBeenCalledWith("household-2");
  expect(mockToggleSubscription).toHaveBeenCalledWith("subscription-1");
  expect(screen.getByText("Household calendars")).toBeTruthy();
});
