import { render } from "@testing-library/react-native";
import { NavigationContext } from "@react-navigation/native";
import { Text } from "react-native-paper";
import { AppScreen } from "@/components/app-screen";
import { AppShell } from "@/components/app-shell/app-shell";

jest.mock("@/components/account-menu", () => ({
  AccountMenu: () => {
    const { Text: MockText } = require("react-native");
    return <MockText>Account menu</MockText>;
  },
}));

jest.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => {
    const { Text: MockText } = require("react-native");
    return <MockText>Theme toggle</MockText>;
  },
}));

describe("AppShell", () => {
  it("renders title, actions, and body content together", () => {
    const screen = render(
      <AppShell title="Dashboard" actions={<Text>Actions</Text>}>
        <Text>Body</Text>
      </AppShell>
    );

    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Actions")).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
  });

  it("renders subtitle and hides the brand label when showBrand is false", () => {
    const screen = render(
      <AppShell title="Dashboard" subtitle="Shared overview" showBrand={false}>
        <Text>Body</Text>
      </AppShell>
    );

    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Shared overview")).toBeTruthy();
    expect(screen.queryByText("Othello-Cloud")).toBeNull();
  });
});

describe("AppScreen", () => {
  const originalDocument = global.document;

  beforeEach(() => {
    global.document = { title: "" } as Document;
  });

  afterEach(() => {
    global.document = originalDocument;
  });

  it("forwards subtitle and actions to the shared shell", () => {
    const screen = render(
      <AppScreen title="Dashboard" subtitle="Shared overview" actions={<Text>Actions</Text>}>
        <Text>Body</Text>
      </AppScreen>
    );

    expect(screen.getByText("Othello-Cloud")).toBeTruthy();
    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Shared overview")).toBeTruthy();
    expect(screen.getByText("Actions")).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
  });

  it("keeps the brand-only browser title when the screen title matches the brand", () => {
    render(
      <AppScreen title="Othello-Cloud">
        <Text>Body</Text>
      </AppScreen>
    );

    expect(global.document.title).toBe("Othello-Cloud");
  });

  it("updates the browser title on focus and still supports the legacy right prop", () => {
    const addListener = jest.fn((_event: string, callback: () => void) => {
      callback();
      return jest.fn();
    });
    const navigation = {
      isFocused: () => false,
      addListener,
    };

    const screen = render(
      <NavigationContext.Provider value={navigation as any}>
        <AppScreen title="Dashboard" right={<Text>Legacy action</Text>}>
          <Text>Body</Text>
        </AppScreen>
      </NavigationContext.Provider>
    );

    expect(addListener).toHaveBeenCalledWith("focus", expect.any(Function));
    expect(global.document.title).toBe("Othello-Cloud | Dashboard");
    expect(screen.getByText("Legacy action")).toBeTruthy();
  });
});
