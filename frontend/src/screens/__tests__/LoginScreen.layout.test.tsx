import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { HouseholdSetupScreen } from "@/src/screens/HouseholdSetupScreen";
import { LoginScreen } from "@/src/screens/LoginScreen";

const mockCreateHousehold = jest.fn();
const mockJoinHousehold = jest.fn();

const mockAppScreen = jest.fn(
  ({
    title,
    subtitle,
    centered,
    maxWidth,
    showBrand,
    browserTitle,
    children,
  }: any) => {
    const { View, Text } = require("react-native");

    return (
      <View>
        <Text>{`title:${title}`}</Text>
        <Text>{`subtitle:${subtitle ?? ""}`}</Text>
        <Text>{`centered:${String(centered)}`}</Text>
        <Text>{`maxWidth:${String(maxWidth)}`}</Text>
        <Text>{`showBrand:${String(showBrand)}`}</Text>
        <Text>{`browserTitle:${browserTitle ?? ""}`}</Text>
        {children}
      </View>
    );
  }
);

jest.mock("@/components/app-screen", () => ({
  AppScreen: (props: any) => mockAppScreen(props),
  layout: {
    card: {},
    formContent: {},
    twoColumnCard: {},
    sectionGrid: {},
    wideRow: {},
  },
}));

jest.mock("@/context/language-context", () => ({
  useLanguage: () => ({
    t: (key: string) =>
      (
        {
          "app.brand": "Othello-Cloud",
          "auth.loginTitle": "Log in",
          "auth.registerTitle": "Create account",
          "auth.loginDescription": "Access your household workspace.",
          "auth.registerDescription": "Create your shared household account.",
          "auth.loginButton": "Log in",
          "auth.registerButton": "Create account",
          "auth.loginToggle": "Need an account?",
          "auth.registerToggle": "Already have an account?",
          "auth.nameLabel": "Name",
          "auth.namePlaceholder": "Alex Example",
          "auth.emailLabel": "Email",
          "auth.passwordLabel": "Password",
          "setup.title": "Household setup",
          "setup.createHouseholdTitle": "Create household",
          "setup.joinHouseholdTitle": "Join household",
          "setup.createDescription": "Start a new household space.",
          "setup.joinDescription": "Use an invite code to join.",
          "setup.householdNameLabel": "Household name",
          "setup.householdNamePlaceholder": "Sunny Flat",
          "setup.inviteCodeLabel": "Invite code",
          "setup.inviteCodePlaceholder": "ABCD1234",
          "setup.createButton": "Create household",
          "setup.joinButton": "Join household",
          "setup.householdNameRequired": "Household name required",
          "setup.inviteCodeRequired": "Invite code required",
        } satisfies Record<string, string>
      )[key] ?? key,
  }),
}));

jest.mock("@/src/lib/household", () => ({
  createHousehold: (...args: any[]) => mockCreateHousehold(...args),
  joinHousehold: (...args: any[]) => mockJoinHousehold(...args),
}));

jest.mock("react-native-paper", () => {
  const React = require("react");
  const { Pressable, Text, TextInput, View } = require("react-native");

  const Button = ({ children, onPress, disabled }: any) => (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}>
      <Text>{children}</Text>
    </Pressable>
  );

  const Card = ({ children }: any) => <View>{children}</View>;
  Card.Title = ({ title }: any) => <Text>{title}</Text>;
  Card.Content = ({ children }: any) => <View>{children}</View>;

  return {
    Button,
    Card,
    Text,
    TextInput,
  };
});

describe("LoginScreen layout", () => {
  beforeEach(() => {
    mockAppScreen.mockClear();
    mockCreateHousehold.mockReset();
    mockJoinHousehold.mockReset();
  });

  it("switches shell copy, register-only fields, and primary CTA with auth mode", () => {
    const screen = render(<LoginScreen onLogin={jest.fn()} />);

    expect(screen.getByText("title:Log in")).toBeTruthy();
    expect(screen.getByText("subtitle:Access your household workspace.")).toBeTruthy();
    expect(screen.getByText("centered:true")).toBeTruthy();
    expect(screen.getByText("maxWidth:460")).toBeTruthy();
    expect(screen.getByText("browserTitle:Othello-Cloud")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Alex Example")).toBeNull();
    expect(screen.getByText("Log in")).toBeTruthy();

    fireEvent.press(screen.getByText("Need an account?"));

    expect(screen.getByText("title:Create account")).toBeTruthy();
    expect(
      screen.getByText("subtitle:Create your shared household account.")
    ).toBeTruthy();
    expect(screen.getByPlaceholderText("Alex Example")).toBeTruthy();
    expect(screen.getByText("Create account")).toBeTruthy();
  });
});

describe("HouseholdSetupScreen", () => {
  it("clears stale invite codes when the deep-link prop is removed", () => {
    const screen = render(
      <HouseholdSetupScreen
        initialInviteCode=" abcd1234 "
        onHouseholdReady={jest.fn()}
      />
    );

    expect(screen.getByDisplayValue(" ABCD1234 ")).toBeTruthy();

    screen.rerender(
      <HouseholdSetupScreen initialInviteCode={undefined} onHouseholdReady={jest.fn()} />
    );

    expect(screen.queryByDisplayValue(" ABCD1234 ")).toBeNull();
    expect(screen.getByPlaceholderText("ABCD1234")).toHaveProp("value", "");
  });

  it("trims household names and uppercases trimmed invite codes before submit", async () => {
    mockCreateHousehold.mockResolvedValue(undefined);
    mockJoinHousehold.mockResolvedValue(undefined);

    const screen = render(<HouseholdSetupScreen onHouseholdReady={jest.fn()} />);

    fireEvent.changeText(screen.getByPlaceholderText("Sunny Flat"), "  Sunny Flat  ");
    fireEvent.press(screen.getAllByText("Create household").at(-1)!);

    await waitFor(() => {
      expect(mockCreateHousehold).toHaveBeenCalledWith("Sunny Flat");
    });

    fireEvent.changeText(screen.getByPlaceholderText("ABCD1234"), "  abcd1234  ");
    fireEvent.press(screen.getAllByText("Join household").at(-1)!);

    await waitFor(() => {
      expect(mockJoinHousehold).toHaveBeenCalledWith("ABCD1234");
    });
  });
});
