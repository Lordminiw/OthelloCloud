import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";
import { CalendarScreen } from "../CalendarScreen";
import {
  createCalendarEvent,
  loadCalendarEventsForMonth,
  loadImportedCalendarEventsForMonth,
} from "../../lib/calendar";
import { loadHouseholdMembers } from "../../lib/members";
import {
  loadAccessibleCalendarSubscriptions,
  loadUserUnsubscribes,
} from "../../lib/calendar-subscriptions";

jest.mock("@/context/language-context", () => ({
  useLanguage: () => ({
    language: "de",
    t: (key: string) => key,
  }),
}));

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

jest.mock("@/components/calendar-display-dropdown", () => ({
  CalendarDisplayDropdown: () => null,
}));

jest.mock("react-native-calendars", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text, View } = require("react-native");

  return {
    Calendar: ({ onDayPress }: any) => (
      <View>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            onDayPress?.({
              dateString: "2026-06-20",
              day: 20,
              month: 6,
              year: 2026,
              timestamp: 1781913600000,
            })
          }
        >
          <Text>Mock day 2026-06-20</Text>
        </Pressable>
      </View>
    ),
    LocaleConfig: { locales: {}, defaultLocale: "de" },
  };
});

jest.mock("react-native-paper", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text, TextInput, View } = require("react-native");

  const Button = ({ children, onPress, disabled, ...props }: any) => (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      {...props}
    >
      <Text>{children}</Text>
    </Pressable>
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

  const List = {
    Icon: () => null,
    Item: ({ title, description, left, right }: any) => (
      <View>
        {left ? left({}) : null}
        <Text>{title}</Text>
        {description ? <Text>{description}</Text> : null}
        {right ? right({}) : null}
      </View>
    ),
  };

  return {
    Button,
    Card,
    Dialog,
    Divider: () => <View />,
    List,
    Portal: ({ children }: any) => <View>{children}</View>,
    Switch: ({ value, onValueChange }: any) => (
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        onPress={() => onValueChange?.(!value)}
      >
        <Text>{value ? "Switch on" : "Switch off"}</Text>
      </Pressable>
    ),
    Text,
    TextInput,
    useTheme: () => ({ colors: { primary: "#2563eb", surface: "#ffffff" } }),
  };
});

jest.mock("../../lib/calendar", () => {
  const actual = jest.requireActual("../../lib/calendar");

  return {
    ...actual,
    createCalendarEvent: jest.fn(),
    deleteCalendarEvent: jest.fn(),
    loadCalendarEventsForMonth: jest.fn(),
    loadImportedCalendarEventsForMonth: jest.fn(),
    updateCalendarEvent: jest.fn(),
  };
});

jest.mock("../../lib/members", () => ({
  loadHouseholdMembers: jest.fn(),
}));

jest.mock("../../lib/calendar-subscriptions", () => ({
  loadAccessibleCalendarSubscriptions: jest.fn(),
  loadUserUnsubscribes: jest.fn(),
}));

const mockLoadCalendarEventsForMonth = jest.mocked(loadCalendarEventsForMonth);
const mockLoadImportedCalendarEventsForMonth = jest.mocked(loadImportedCalendarEventsForMonth);
const mockCreateCalendarEvent = jest.mocked(createCalendarEvent);
const mockLoadHouseholdMembers = jest.mocked(loadHouseholdMembers);
const mockLoadAccessibleCalendarSubscriptions = jest.mocked(loadAccessibleCalendarSubscriptions);
const mockLoadUserUnsubscribes = jest.mocked(loadUserUnsubscribes);

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
    },
  });
  mockLoadCalendarEventsForMonth.mockResolvedValue([
    {
      id: "event-today",
      household: "house-1",
      title: "Kuechendienst",
      start: "2026-06-13T10:00:00.000Z",
      end: "2026-06-13T11:00:00.000Z",
      createdBy: "user-1",
    },
    {
      id: "event-1",
      household: "house-1",
      title: "Hausversammlung",
      start: "2026-06-14T10:00:00.000Z",
      end: "2026-06-14T11:00:00.000Z",
      createdBy: "user-1",
    },
  ]);
  mockLoadImportedCalendarEventsForMonth.mockResolvedValue([]);
  mockCreateCalendarEvent.mockResolvedValue({} as any);
  mockLoadHouseholdMembers.mockResolvedValue([
    { id: "member-1", userId: "user-1", email: "one@example.com", name: "Alex", role: "admin" },
  ]);
  mockLoadAccessibleCalendarSubscriptions.mockResolvedValue([]);
  mockLoadUserUnsubscribes.mockResolvedValue([]);
});

it("shows date and weekday for upcoming calendar events", async () => {
  render(<CalendarScreen householdId="house-1" />);

  await waitFor(() => expect(screen.getByText("Anstehende Termine")).toBeTruthy());

  expect(screen.getByText("Hausversammlung")).toBeTruthy();
  expect(screen.getByText(/So\., 14\.06\.2026/)).toBeTruthy();
});

it("folds current day agenda events into upcoming events and marks them", async () => {
  render(<CalendarScreen householdId="house-1" />);

  await waitFor(() => expect(screen.getByText("Anstehende Termine")).toBeTruthy());

  expect(screen.queryByText(/Agenda für/)).toBeNull();
  expect(screen.getByText("Kuechendienst")).toBeTruthy();
  expect(screen.getByText("Heute")).toBeTruthy();
});

it("creates an all-day event on the start date chosen in the dialog", async () => {
  render(<CalendarScreen householdId="house-1" />);

  await waitFor(() => expect(screen.getByText(/Termin hinzuf/)).toBeTruthy());

  fireEvent.press(screen.getByText(/Termin hinzuf/));
  fireEvent.changeText(screen.getAllByDisplayValue("")[0], "Muellabfuhr");
  fireEvent.press(screen.getByText(/Startdatum:/));
  fireEvent.press(screen.getAllByText("Mock day 2026-06-20").at(-1)!);
  fireEvent.press(screen.getAllByRole("switch")[0]);
  fireEvent.press(screen.getByText("Speichern"));

  await waitFor(() =>
    expect(mockCreateCalendarEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId: "house-1",
        title: "Muellabfuhr",
        startIso: "2026-06-20T00:00:00.000Z",
        endIso: undefined,
        allDay: true,
      })
    )
  );
});

it("creates a timed event with times chosen through the picker", async () => {
  render(<CalendarScreen householdId="house-1" />);

  await waitFor(() => expect(screen.getByText(/Termin hinzuf/)).toBeTruthy());

  fireEvent.press(screen.getByText(/Termin hinzuf/));
  fireEvent.changeText(screen.getAllByDisplayValue("")[0], "Spieleabend");

  fireEvent.press(screen.getByText("Startzeit: 19:00"));
  fireEvent.press(screen.getByLabelText("Startzeit Stunde erhoehen"));
  fireEvent.press(screen.getByLabelText("Startzeit Minute erhoehen"));
  fireEvent.press(screen.getByLabelText("Startzeit Minute erhoehen"));
  fireEvent.press(screen.getByText("OK"));

  fireEvent.press(screen.getByText("Endzeit: 20:00"));
  fireEvent.press(screen.getByLabelText("Endzeit Stunde erhoehen"));
  fireEvent.press(screen.getByLabelText("Endzeit Minute erhoehen"));
  fireEvent.press(screen.getByLabelText("Endzeit Minute erhoehen"));
  fireEvent.press(screen.getByText("OK"));

  fireEvent.press(screen.getByText("Speichern"));

  await waitFor(() =>
    expect(mockCreateCalendarEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId: "house-1",
        title: "Spieleabend",
        startIso: "2026-06-13T18:10:00.000Z",
        endIso: "2026-06-13T19:10:00.000Z",
        allDay: false,
      })
    )
  );
});
