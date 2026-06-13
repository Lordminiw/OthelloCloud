import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { NavigationContext } from "@react-navigation/native";
import { AccountMenu } from "../account-menu";
import { SessionActionsProvider } from "@/context/session-context";

const mockNavigate = jest.fn();
const mockOnLogout = jest.fn();
const mockSetActiveHousehold = jest.fn();
const mockSetLanguage = jest.fn();

jest.mock("@react-navigation/native", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  NavigationContext: require("react").createContext(null),
}));

jest.mock("@/context/language-context", () => ({
  useLanguage: () => ({
    language: "en",
    languages: ["en", "de"],
    setLanguage: mockSetLanguage,
    t: (key: string) =>
      ({
        "account.settings": "Settings",
        "account.logout": "Log out",
        "account.currentHousehold": "Current household",
        "account.unknownUser": "User",
        "common.chooseHousehold": "Choose household",
        "language.label": "Language",
        "language.english": "English",
        "language.german": "German",
      })[key] ?? key,
  }),
}));

jest.mock("@/context/household-context", () => ({
  useHousehold: () => ({
    households: [
      { id: "household-1", name: "Othello House" },
      { id: "household-2", name: "Second WG" },
    ],
    activeHousehold: { id: "household-1", name: "Othello House" },
    setActiveHousehold: mockSetActiveHousehold,
  }),
}));

jest.mock("@/src/lib/pocketbase", () => ({
  pb: {
    authStore: {
      model: { id: "user-1", name: "Hannes", email: "hannes@example.com" },
    },
  },
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

  function MenuItem({ title, onPress }: any) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text>{title}</Text>
      </Pressable>
    );
  }

  Menu.Item = MenuItem;

  return {
    Button,
    Divider: function Divider() {
      return <View />;
    },
    Menu,
    Text,
    useTheme: () => ({
      colors: {
        primary: "#2563eb",
        surfaceVariant: "#eef2ff",
      },
    }),
  };
});

function renderMenu() {
  return render(
    <NavigationContext.Provider value={{ navigate: mockNavigate } as any}>
      <SessionActionsProvider onLogout={mockOnLogout}>
        <AccountMenu />
      </SessionActionsProvider>
    </NavigationContext.Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

it("opens account options with profile details", () => {
  renderMenu();

  fireEvent.press(screen.getByTestId("account-menu-button"));

  expect(screen.getAllByText("Hannes").length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText("hannes@example.com")).toBeTruthy();
  expect(screen.getByText("Current household: Othello House")).toBeTruthy();
  expect(screen.getByText("Choose household")).toBeTruthy();
  expect(screen.getByText("Language")).toBeTruthy();
});

it("toggles account options when pressing the username repeatedly", () => {
  renderMenu();

  fireEvent.press(screen.getByTestId("account-menu-button"));
  expect(screen.getByText("Settings")).toBeTruthy();

  fireEvent.press(screen.getByTestId("account-menu-button"));
  expect(screen.queryByText("Settings")).toBeNull();

  fireEvent.press(screen.getByTestId("account-menu-button"));
  expect(screen.getByText("Settings")).toBeTruthy();
});

it("switches household from the account menu", () => {
  renderMenu();

  fireEvent.press(screen.getByTestId("account-menu-button"));
  fireEvent.press(screen.getByText("Second WG"));

  expect(mockSetActiveHousehold).toHaveBeenCalledWith({
    id: "household-2",
    name: "Second WG",
  });
});

it("switches language from the account menu", () => {
  renderMenu();

  fireEvent.press(screen.getByTestId("account-menu-button"));
  fireEvent.press(screen.getByText("German"));

  expect(mockSetLanguage).toHaveBeenCalledWith("de");
});

it("opens the settings route from the menu", () => {
  renderMenu();

  fireEvent.press(screen.getByTestId("account-menu-button"));
  fireEvent.press(screen.getByText("Settings"));

  expect(mockNavigate).toHaveBeenCalledWith("settings");
});

it("logs out through the app session action", () => {
  renderMenu();

  fireEvent.press(screen.getByTestId("account-menu-button"));
  fireEvent.press(screen.getByText("Log out"));

  expect(mockOnLogout).toHaveBeenCalledTimes(1);
});
