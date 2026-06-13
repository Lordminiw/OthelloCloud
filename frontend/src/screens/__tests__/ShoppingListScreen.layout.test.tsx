import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ShoppingListScreen } from "@/src/screens/ShoppingListScreen";

const shoppingRecords = [
  { id: "open-1", name: "Milk", quantity: "2L", checked: false },
  { id: "checked-1", name: "Mints", checked: true },
];

const mockGetFullList = jest.fn(() => Promise.resolve(shoppingRecords));
const mockSubscribe = jest.fn().mockResolvedValue(undefined);
const mockUnsubscribe = jest.fn().mockResolvedValue(undefined);

const mockAppScreen = jest.fn(
  ({ title, subtitle, browserTitle, children }: any) => {
    const { Text, View } = require("react-native");

    return (
      <View>
        <Text>{`title:${title}`}</Text>
        <Text>{`subtitle:${subtitle ?? ""}`}</Text>
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
    listCardContent: {},
    stack: {},
    wideForm: {},
    widePanel: {},
  },
}));

jest.mock("@/components/layout", () => ({
  PageSection: ({ children }: any) => {
    const { Text, View } = require("react-native");
    return (
      <View>
        <Text>PageSection</Text>
        {children}
      </View>
    );
  },
  SplitLayout: ({ children }: any) => {
    const { Text, View } = require("react-native");
    return (
      <View>
        <Text>SplitLayout</Text>
        {children}
      </View>
    );
  },
}));

jest.mock("@/context/language-context", () => ({
  useLanguage: () => ({
    language: "en",
    t: (key: string) =>
      (
        {
          "shopping.title": "Shopping list",
          "shopping.browserTitle": "Othello-Cloud | Shopping list",
          "shopping.newItemTitle": "Add item",
          "shopping.itemLabel": "Item",
          "shopping.addButton": "Add",
          "shopping.completedSection": "Completed",
          "common.noItems": "No items yet.",
          "common.noCompletedItems": "No completed items yet.",
        } satisfies Record<string, string>
      )[key] ?? key,
  }),
}));

jest.mock("@/src/lib/pocketbase", () => ({
  pb: {
    authStore: {
      model: { id: "user-1" },
    },
    collection: () => ({
      getFullList: (...args: any[]) => mockGetFullList(...args),
      subscribe: (...args: any[]) => mockSubscribe(...args),
      unsubscribe: (...args: any[]) => mockUnsubscribe(...args),
      create: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

jest.mock("react-native-paper", () => {
  const React = require("react");
  const { Pressable, Text, TextInput, View } = require("react-native");

  const Button = ({ children, onPress }: any) => (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Text>{children}</Text>
    </Pressable>
  );

  const Card = ({ children }: any) => <View>{children}</View>;
  Card.Title = ({ title, subtitle, right }: any) => (
    <View>
      <Text>{title}</Text>
      {subtitle ? <Text>{subtitle}</Text> : null}
      {right ? right() : null}
    </View>
  );
  Card.Content = ({ children }: any) => <View>{children}</View>;

  const Divider = () => <Text>Divider</Text>;
  const List = {
    Item: ({ title, description, onPress }: any) => (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text>{title}</Text>
        {description ? <Text>{description}</Text> : null}
      </Pressable>
    ),
    Icon: () => null,
  };

  return {
    Button,
    Card,
    Divider,
    List,
    Text,
    TextInput,
  };
});

describe("ShoppingListScreen layout", () => {
  beforeEach(() => {
    mockAppScreen.mockClear();
    mockGetFullList.mockClear();
    mockGetFullList.mockImplementation(() => Promise.resolve(shoppingRecords));
    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();
  });

  it("renders through the shared section primitives and keeps the form plus both list sections", async () => {
    const screen = render(<ShoppingListScreen householdId="household-1" />);

    expect(screen.getByText("title:Shopping list")).toBeTruthy();
    expect(screen.getByText("browserTitle:Othello-Cloud | Shopping list")).toBeTruthy();
    expect(screen.getAllByText("PageSection").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SplitLayout").length).toBeGreaterThan(0);
    expect(screen.getByText("Add item")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Open (1)")).toBeTruthy();
      expect(screen.getByText("Completed (1)")).toBeTruthy();
    });
  });

  it("clears a stale quantity when a suggestion without quantity is selected", async () => {
    const screen = render(<ShoppingListScreen householdId="household-1" />);

    await waitFor(() => {
      expect(screen.getByText("Open (1)")).toBeTruthy();
    });

    const inputs = screen.UNSAFE_getAllByType(require("react-native").TextInput);
    fireEvent.changeText(inputs[0], "Mi");

    await waitFor(() => {
      expect(screen.getAllByText("Milk").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Mints").length).toBeGreaterThan(0);
    });

    const quantityInput = screen.getByPlaceholderText("e.g. 2x, 1 kg, 500 g");

    fireEvent.press(screen.getByText("Last used: 2L"));
    await waitFor(() => {
      expect(quantityInput).toHaveProp("value", "2L");
    });

    fireEvent.changeText(inputs[0], "M");
    await waitFor(() => {
      expect(screen.getByText("Used before")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Used before"));
    await waitFor(() => {
      expect(quantityInput).toHaveProp("value", "");
    });
  });
});
