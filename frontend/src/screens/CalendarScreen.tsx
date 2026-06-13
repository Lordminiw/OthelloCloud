import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Calendar, CalendarProps, DateData, LocaleConfig } from "react-native-calendars";
import {
  Button,
  Card,
  Dialog,
  Divider,
  List,
  Portal,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
import { useLanguage } from "@/context/language-context";
import {
  CalendarEvent,
  createCalendarEvent,
  deleteCalendarEvent,
  loadImportedCalendarEventsForMonth,
  loadCalendarEventsForMonth,
  parseCalendarEventMeta,
  updateCalendarEvent,
} from "../lib/calendar";
import { CalendarDisplayDropdown } from "@/components/calendar-display-dropdown";
import { pb } from "../lib/pocketbase";
import { HouseholdMember, loadHouseholdMembers } from "../lib/members";
import {
  CalendarSubscription,
  loadAccessibleCalendarSubscriptions,
  loadUserUnsubscribes,
} from "../lib/calendar-subscriptions";

LocaleConfig.locales.de = {
  monthNames: [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ],
  monthNamesShort: [
    "Jan.",
    "Feb.",
    "März",
    "Apr.",
    "Mai",
    "Juni",
    "Juli",
    "Aug.",
    "Sept.",
    "Okt.",
    "Nov.",
    "Dez.",
  ],
  dayNames: [
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
  ],
  dayNamesShort: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  today: "Heute",
};

LocaleConfig.locales.en = {
  monthNames: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  monthNamesShort: [
    "Jan.",
    "Feb.",
    "Mar.",
    "Apr.",
    "May",
    "Jun.",
    "Jul.",
    "Aug.",
    "Sep.",
    "Oct.",
    "Nov.",
    "Dec.",
  ],
  dayNames: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  dayNamesShort: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  today: "Today",
};

type CalendarScreenProps = {
  householdId: string;
};

type CalendarTheme = NonNullable<CalendarProps["theme"]>;

type RequestResponse = "pending" | "yes" | "no";
type TimePickerTarget = "start" | "end";

const DEFAULT_COLOR_PALETTE = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0891b2",
  "#4f46e5",
  "#ca8a04",
];
const EXTERNAL_CALENDAR_COLOR = "#0f766e";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function toDateKeyFromIso(iso: string) {
  return toDateKey(new Date(iso));
}

function makeLocalIso(dateKey: string, time: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute).toISOString();
}

function makeAllDayIso(dateKey: string) {
  return `${dateKey}T00:00:00.000Z`;
}

function getEventDateKey(event: CalendarEvent) {
  if (event.allDay) {
    return event.start.slice(0, 10);
  }
  return toDateKeyFromIso(event.start);
}

function getEventEndDateKey(event: CalendarEvent) {
  if (!event.end) {
    return getEventDateKey(event);
  }

  if (event.allDay) {
    return event.end.slice(0, 10);
  }
  return toDateKeyFromIso(event.end);
}

function getEventTimeLabel(event: CalendarEvent, locale: string) {
  return new Date(event.start).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEventEndTimeLabel(event: CalendarEvent, locale: string) {
  if (!event.end) {
    return "";
  }

  return new Date(event.end).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeInput(dateIso: string) {
  const date = new Date(dateIso);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function shiftTimeInput(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const currentMinutes = hour * 60 + minute;
  const dayMinutes = 24 * 60;
  const nextMinutes =
    ((currentMinutes + minutes) % dayMinutes + dayMinutes) % dayMinutes;

  return `${pad2(Math.floor(nextMinutes / 60))}:${pad2(nextMinutes % 60)}`;
}

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function getDateKeysBetween(startDateKey: string, endDateKey: string) {
  const keys: string[] = [];

  let current = startDateKey;

  while (current <= endDateKey) {
    keys.push(current);
    current = addDays(current, 1);
  }

  return keys;
}

function compareDateKeys(a: string, b: string) {
  return a.localeCompare(b);
}

function isImportedEvent(event: CalendarEvent) {
  return event.source === "ical" || event.source === "upload";
}

function eventTouchesDate(event: CalendarEvent, dateKey: string) {
  const startKey = getEventDateKey(event);
  const endKey = getEventEndDateKey(event);

  return dateKey >= startKey && dateKey <= endKey;
}

function getEffectiveEndDateKey(selectedDateKey: string, newEndDate: string) {
  return newEndDate.trim() || selectedDateKey;
}

function formatDateKey(dateKey: string, locale: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getEventDateRangeLabel(
  event: CalendarEvent,
  locale: string,
  options?: { includeSingleDayDate?: boolean }
) {
  const startKey = getEventDateKey(event);
  const endKey = getEventEndDateKey(event);
  if (event.allDay) {
    return startKey === endKey
      ? formatDateKey(startKey, locale)
      : `${formatDateKey(startKey, locale)} - ${formatDateKey(endKey, locale)}`;
  }
  const startTime = getEventTimeLabel(event, locale);
  const endTime = getEventEndTimeLabel(event, locale);

  if (startKey === endKey) {
    if (options?.includeSingleDayDate) {
      return endTime
        ? `${formatDateKey(startKey, locale)} ${startTime} – ${endTime}`
        : `${formatDateKey(startKey, locale)} ${startTime}`;
    }

    return endTime ? `${startTime} – ${endTime}` : startTime;
  }

  return `${formatDateKey(startKey, locale)} ${startTime} – ${formatDateKey(
    endKey,
    locale
  )}${endTime ? ` ${endTime}` : ""}`;
}

function getStorageKey(householdId: string, suffix: string) {
  return `calendar:${householdId}:${suffix}`;
}

export function CalendarScreen({ householdId }: CalendarScreenProps) {
  const { language, t } = useLanguage();
  const isGerman = language === "de";
  const locale = isGerman ? "de-DE" : "en-US";
  LocaleConfig.defaultLocale = isGerman ? "de" : "en";
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [calendarSubscriptions, setCalendarSubscriptions] = useState<
    CalendarSubscription[]
  >([]);
  const [selectedHouseholdIds, setSelectedHouseholdIds] = useState<string[]>([
    householdId,
  ]);
  const [selectedSubscriptionIds, setSelectedSubscriptionIds] = useState<
    string[]
  >([]);

  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toDateKey(new Date())
  );

  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [startDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [endDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editStartDatePickerVisible, setEditStartDatePickerVisible] =
    useState(false);
  const [editEndDatePickerVisible, setEditEndDatePickerVisible] =
    useState(false);
  const [colorConfigVisible, setColorConfigVisible] = useState(false);
  const [respondingEventId, setRespondingEventId] = useState<string | null>(
    null
  );

  const [newTitle, setNewTitle] = useState("");
  const [newStartDate, setNewStartDate] = useState(() => toDateKey(new Date()));
  const [newAllDay, setNewAllDay] = useState(false);
  const [newTime, setNewTime] = useState("19:00");
  const [newEndDate, setNewEndDate] = useState("");
  const [newEndTime, setNewEndTime] = useState("20:00");
  const [timePickerTarget, setTimePickerTarget] =
    useState<TimePickerTarget | null>(null);
  const [draftTime, setDraftTime] = useState("19:00");
  const [newLocation, setNewLocation] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newRequestParticipation, setNewRequestParticipation] =
    useState(false);
  const [newRequestedMemberIds, setNewRequestedMemberIds] = useState<string[]>(
    []
  );
  const [memberColors, setMemberColors] = useState<Record<string, string>>({});

  const currentUserId = pb.authStore.model?.id ?? "";

  const reloadEvents = useCallback(
    async (date = visibleMonth) => {
      try {
        const records = (
          await Promise.all([
            ...selectedHouseholdIds.map((selectedHouseholdId) =>
              loadCalendarEventsForMonth({
                householdId: selectedHouseholdId,
                year: date.getFullYear(),
                month: date.getMonth(),
              })
            ),
            ...selectedSubscriptionIds.map((subscriptionId) =>
              loadImportedCalendarEventsForMonth({
                subscriptionId,
                year: date.getFullYear(),
                month: date.getMonth(),
              })
            ),
          ])
        ).flat();

        setEvents(records);
      } catch (error: any) {
        console.log("CALENDAR LOAD ERROR:", error);
        console.log("STATUS:", error?.status);
        console.log("MESSAGE:", error?.message);
        console.log("RESPONSE:", error?.response);
      }
    },
    [selectedHouseholdIds, selectedSubscriptionIds, visibleMonth]
  );

  const reloadMembers = useCallback(async () => {
    try {
      const records = await loadHouseholdMembers(householdId);
      setMembers(records);
    } catch (error: any) {
      console.log("CALENDAR MEMBERS LOAD ERROR:", error);
    }
  }, [householdId]);

  useEffect(() => {
    reloadEvents();
  }, [reloadEvents]);

  useEffect(() => {
    reloadMembers();
  }, [reloadMembers]);

  useEffect(() => {
    Promise.all([
      loadAccessibleCalendarSubscriptions(),
      loadUserUnsubscribes(),
    ])
      .then(([subscriptions, unsubscribes]) => {
        const unsubscribedIds = new Set(unsubscribes.map((u) => u.subscription));
        const active = subscriptions.filter((sub) => !unsubscribedIds.has(sub.id));
        setCalendarSubscriptions(active);
        setSelectedSubscriptionIds(active.map((item) => item.id));
      })
      .catch((error) => console.log("CALENDAR SUBSCRIPTIONS LOAD ERROR:", error));
  }, [householdId]);

  useEffect(() => {
    setSelectedHouseholdIds([householdId]);
  }, [householdId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.localStorage.getItem(
      getStorageKey(householdId, "member-colors")
    );

    if (saved) {
      try {
        setMemberColors(JSON.parse(saved));
        return;
      } catch {
        // fall through to defaults
      }
    }

    const defaults = Object.fromEntries(
      members.map((member, index) => [
        member.userId,
        DEFAULT_COLOR_PALETTE[index % DEFAULT_COLOR_PALETTE.length],
      ])
    );

    if (Object.keys(defaults).length > 0) {
      setMemberColors(defaults);
    }
  }, [householdId, members]);

  useEffect(() => {
    if (typeof window === "undefined" || Object.keys(memberColors).length === 0) {
      return;
    }

    window.localStorage.setItem(
      getStorageKey(householdId, "member-colors"),
      JSON.stringify(memberColors)
    );
  }, [householdId, memberColors]);

  const selectedEvents = useMemo(() => {
    return events
      .filter((event) => eventTouchesDate(event, selectedDateKey))
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [events, selectedDateKey]);
  const selectedDateIsToday = selectedDateKey === toDateKey(new Date());
  const selectedEventBadgeLabel = selectedDateIsToday
    ? (isGerman ? "Heute" : "Today")
    : formatDateKey(selectedDateKey, locale);

  const upcomingEvents = useMemo(() => {
    return events
      .filter((event) => getEventEndDateKey(event) >= selectedDateKey)
      .filter((event) => getEventDateKey(event) !== selectedDateKey)
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 8);
  }, [events, selectedDateKey]);

  function getMemberLabel(userId: string) {
    const member = members.find((item) => item.userId === userId);
    return member?.name || member?.email || "Unbekannt";
  }

  function getSubscriptionLabel(subscriptionId?: string) {
    if (!subscriptionId) {
      return t("profile.externalCalendarUploadedSource");
    }

    return (
      calendarSubscriptions.find((item) => item.id === subscriptionId)?.name ??
      t("calendar.externalCalendarSource")
    );
  }

  function toggleSelectedHousehold(targetHouseholdId: string) {
    setSelectedHouseholdIds((current) =>
      current.includes(targetHouseholdId)
        ? current.filter((id) => id !== targetHouseholdId)
        : [...current, targetHouseholdId]
    );
  }

  function toggleSelectedSubscription(subscriptionId: string) {
    setSelectedSubscriptionIds((current) =>
      current.includes(subscriptionId)
        ? current.filter((id) => id !== subscriptionId)
        : [...current, subscriptionId]
    );
  }

  const getMemberColor = useCallback(
    (userId: string) => memberColors[userId] || DEFAULT_COLOR_PALETTE[0],
    [memberColors]
  );

  function getEventMeta(event: CalendarEvent) {
    return parseCalendarEventMeta(event.description);
  }

  function getRequestStatusForCurrentUser(event: CalendarEvent) {
    const meta = getEventMeta(event);

    if (!meta.requestParticipation) {
      return null;
    }

    if (!meta.requestedMemberIds?.includes(currentUserId)) {
      return null;
    }

    return meta.responses?.[currentUserId] ?? "pending";
  }

  const creatorOptions = useMemo(
    () => members.filter((member) => member.userId !== currentUserId),
    [currentUserId, members]
  );

  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};
    const sortedEvents = [...events].sort((a, b) =>
      compareDateKeys(getEventDateKey(a), getEventDateKey(b))
    );

    for (const event of sortedEvents) {
      const startKey = getEventDateKey(event);
      const endKey = getEventEndDateKey(event);
      const dateKeys = getDateKeysBetween(startKey, endKey);
      const color =
        isImportedEvent(event)
          ? EXTERNAL_CALENDAR_COLOR
          : getMemberColor(event.createdBy ?? "");

      dateKeys.forEach((dateKey, index) => {
        const isStart = index === 0;
        const isEnd = index === dateKeys.length - 1;
        const current = marked[dateKey] ?? { periods: [] };

        marked[dateKey] = {
          ...current,
          periods: [
            ...(current.periods ?? []),
            {
              color,
              startingDay: isStart,
              endingDay: isEnd,
            },
          ],
        };
      });
    }

    marked[selectedDateKey] = {
      ...(marked[selectedDateKey] ?? {}),
      selected: true,
      selectedColor: theme.colors.primary,
    };

    return marked;
  }, [events, getMemberColor, selectedDateKey, theme.colors.primary]);

  const calendarTheme = useMemo<CalendarTheme>(
    () => ({
      calendarBackground: theme.colors.surface,
      textSectionTitleColor: theme.colors.onSurface,
      dayTextColor: theme.colors.onSurface,
      monthTextColor: theme.colors.onSurface,
      arrowColor: theme.colors.primary,
      todayBackgroundColor: theme.colors.primaryContainer,
      todayTextColor: theme.colors.primary,
      selectedDayBackgroundColor: theme.colors.primary,
      selectedDayTextColor: theme.colors.onPrimary,
      textDisabledColor: theme.dark ? "#555" : "#d9e1e8",
      "stylesheet.day.basic": {
        today: {
          backgroundColor: theme.colors.primaryContainer,
          borderColor: theme.colors.primary,
          borderRadius: 16,
          borderWidth: 1.5,
        },
        todayText: {
          color: theme.colors.primary,
          fontWeight: "700",
        },
      },
      "stylesheet.day.period": {
        today: {
          backgroundColor: theme.colors.primaryContainer,
          borderColor: theme.colors.primary,
          borderRadius: 17,
          borderWidth: 1.5,
        },
        todayText: {
          color: theme.colors.primary,
          fontWeight: "700",
        },
      },
    }),
    [
      theme.colors.onPrimary,
      theme.colors.onSurface,
      theme.colors.primary,
      theme.colors.primaryContainer,
      theme.colors.surface,
      theme.dark,
    ]
  );

  function handleMonthChange(month: DateData) {
    setVisibleMonth(new Date(month.year, month.month - 1, 1));
  }

  function handleDayPress(day: DateData) {
    setSelectedDateKey(day.dateString);
  }

  function openCreateDialog() {
    setNewTitle("");
    setNewStartDate(selectedDateKey);
    setNewAllDay(false);
    setNewTime("19:00");
    setNewEndDate("");
    setNewEndTime("20:00");
    setNewLocation("");
    setNewNotes("");
    setNewRequestParticipation(false);
    setNewRequestedMemberIds([]);
    setCreateDialogVisible(true);
  }

  function openEditDialog(event: CalendarEvent) {
    const startDateKey = getEventDateKey(event);
    const endDateKey = getEventEndDateKey(event);
    const endTime = event.end ? formatTimeInput(event.end) : "20:00";
    const meta = getEventMeta(event);

    setEditingEvent(event);
    setSelectedDateKey(startDateKey);
    setNewTitle(event.title);
    setNewStartDate(startDateKey);
    setNewAllDay(Boolean(event.allDay));
    setNewTime(formatTimeInput(event.start));
    setNewEndDate(endDateKey === startDateKey ? "" : endDateKey);
    setNewEndTime(endTime);
    setNewLocation(event.location ?? "");
    setNewNotes(meta.notes ?? "");
    setNewRequestParticipation(Boolean(meta.requestParticipation));
    setNewRequestedMemberIds(meta.requestedMemberIds ?? []);
  }

  function closeEditDialog() {
    setEditingEvent(null);
    setTimePickerTarget(null);
    setEditStartDatePickerVisible(false);
    setEditEndDatePickerVisible(false);
  }

  function changeNewStartDate(dateKey: string) {
    setNewStartDate(dateKey);
    setNewEndDate((current) => (current && current < dateKey ? "" : current));
  }

  function openTimePicker(target: TimePickerTarget) {
    setDraftTime(target === "start" ? newTime : newEndTime);
    setTimePickerTarget(target);
  }

  function confirmTimePicker() {
    if (timePickerTarget === "start") {
      setNewTime(draftTime);
    }

    if (timePickerTarget === "end") {
      setNewEndTime(draftTime);
    }

    setTimePickerTarget(null);
  }

  function toggleRequestedMember(userId: string) {
    setNewRequestedMemberIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }

  function setMemberColor(userId: string, color: string) {
    setMemberColors((current) => ({
      ...current,
      [userId]: color,
    }));
  }

  function buildPendingResponses(memberIds: string[]) {
    return Object.fromEntries(
      memberIds.map((memberId) => [memberId, "pending"])
    ) as Record<string, RequestResponse>;
  }

  async function addEvent() {
    if (!newTitle.trim()) {
      alert(isGerman ? "Bitte Titel eingeben." : "Please enter a title.");
      return;
    }

    if (!newAllDay && !/^\d\d:\d\d$/.test(newTime)) {
      alert(isGerman ? "Bitte Start-Uhrzeit im Format HH:MM eingeben." : "Please enter a start time in HH:MM format.");
      return;
    }

    if (!newAllDay && !/^\d\d:\d\d$/.test(newEndTime)) {
      alert(isGerman ? "Bitte End-Uhrzeit im Format HH:MM eingeben." : "Please enter an end time in HH:MM format.");
      return;
    }

    const endDateKey = getEffectiveEndDateKey(newStartDate, newEndDate);
    const startIso = newAllDay
      ? makeAllDayIso(newStartDate)
      : makeLocalIso(newStartDate, newTime);
    const endIso = newAllDay
      ? newEndDate
        ? makeAllDayIso(endDateKey)
        : undefined
      : makeLocalIso(endDateKey, newEndTime);

    if (newAllDay ? endDateKey < newStartDate : new Date(endIso ?? "") < new Date(startIso)) {
      alert(isGerman ? "Das Ende darf nicht vor dem Start liegen." : "The end must not be before the start.");
      return;
    }

    try {
      await createCalendarEvent({
        householdId,
        title: newTitle.trim(),
        startIso,
        endIso,
        allDay: newAllDay,
        location: newLocation.trim(),
        notes: newNotes.trim(),
        requestParticipation: newRequestParticipation,
        requestedMemberIds: newRequestedMemberIds,
        responses: newRequestParticipation
          ? buildPendingResponses(newRequestedMemberIds)
          : undefined,
      });

      setNewTitle("");
      setNewStartDate(selectedDateKey);
      setNewAllDay(false);
      setNewTime("19:00");
      setNewEndDate("");
      setNewEndTime("20:00");
      setNewLocation("");
      setNewNotes("");
      setNewRequestParticipation(false);
      setNewRequestedMemberIds([]);

      await reloadEvents();
      setCreateDialogVisible(false);
    } catch (error: any) {
      console.log("CALENDAR ADD ERROR:", error);
      console.log("STATUS:", error?.status);
      console.log("MESSAGE:", error?.message);
      console.log("RESPONSE:", error?.response);
      alert(JSON.stringify(error?.response, null, 2));
    }
  }

  async function saveEditedEvent() {
    if (!editingEvent) {
      return;
    }

    if (!newTitle.trim()) {
      alert(isGerman ? "Bitte Titel eingeben." : "Please enter a title.");
      return;
    }

    if (!newAllDay && !/^\d\d:\d\d$/.test(newTime)) {
      alert(isGerman ? "Bitte Start-Uhrzeit im Format HH:MM eingeben." : "Please enter a start time in HH:MM format.");
      return;
    }

    if (!newAllDay && !/^\d\d:\d\d$/.test(newEndTime)) {
      alert(isGerman ? "Bitte End-Uhrzeit im Format HH:MM eingeben." : "Please enter an end time in HH:MM format.");
      return;
    }

    const startDateKey = newStartDate;
    const endDateKey = getEffectiveEndDateKey(startDateKey, newEndDate);
    const startIso = newAllDay
      ? makeAllDayIso(startDateKey)
      : makeLocalIso(startDateKey, newTime);
    const endIso = newAllDay
      ? newEndDate
        ? makeAllDayIso(endDateKey)
        : undefined
      : makeLocalIso(endDateKey, newEndTime);

    if (newAllDay ? endDateKey < startDateKey : new Date(endIso ?? "") < new Date(startIso)) {
      alert(isGerman ? "Das Ende darf nicht vor dem Start liegen." : "The end must not be before the start.");
      return;
    }

    try {
      await updateCalendarEvent(editingEvent.id, {
        title: newTitle.trim(),
        startIso,
        endIso,
        allDay: newAllDay,
        location: newLocation.trim(),
        notes: newNotes.trim(),
        requestParticipation: newRequestParticipation,
        requestedMemberIds: newRequestedMemberIds,
        responses: newRequestParticipation
          ? buildPendingResponses(newRequestedMemberIds)
          : undefined,
      });

      await reloadEvents();
      closeEditDialog();
    } catch (error: any) {
      console.log("CALENDAR UPDATE ERROR:", error);
      console.log("STATUS:", error?.status);
      console.log("MESSAGE:", error?.message);
      console.log("RESPONSE:", error?.response);
      alert(JSON.stringify(error?.response, null, 2));
    }
  }

  async function respondToEvent(
    event: CalendarEvent,
    response: Exclude<RequestResponse, "pending">
  ) {
    const meta = getEventMeta(event);
    const requestedMemberIds = meta.requestedMemberIds ?? [];

    if (!requestedMemberIds.includes(currentUserId)) {
      return;
    }

    setRespondingEventId(event.id);

    try {
      await updateCalendarEvent(event.id, {
        title: event.title,
        startIso: event.start,
        endIso: event.end,
        allDay: event.allDay,
        location: event.location,
        notes: meta.notes ?? "",
        requestParticipation: true,
        requestedMemberIds,
        responses: {
          ...(meta.responses ?? {}),
          [currentUserId]: response,
        },
      });

      await reloadEvents();
    } catch (error: any) {
      console.log("CALENDAR RESPONSE ERROR:", error);
      alert(JSON.stringify(error?.response, null, 2));
    } finally {
      setRespondingEventId(null);
    }
  }

  async function removeEvent(event: CalendarEvent) {
    try {
      await deleteCalendarEvent(event.id);
      await reloadEvents();
    } catch (error: any) {
      console.log("CALENDAR DELETE ERROR:", error);
      console.log("STATUS:", error?.status);
      console.log("MESSAGE:", error?.message);
      console.log("RESPONSE:", error?.response);
      alert(JSON.stringify(error?.response, null, 2));
    }
  }

  const selectedEventViews = selectedEvents.map((event) => {
    const isExternal = isImportedEvent(event);
    const meta = getEventMeta(event);
    const creatorLabel = isExternal
      ? getSubscriptionLabel(event.subscription)
      : getMemberLabel(event.createdBy ?? "");
    const creatorColor = isExternal
      ? EXTERNAL_CALENDAR_COLOR
      : getMemberColor(event.createdBy ?? "");
    const creatorLine = isExternal
      ? `${t("profile.externalCalendarName")}: ${creatorLabel}`
      : `${isGerman ? "Erstellt von" : "Created by"}: ${creatorLabel}`;
    const requestStatus = getRequestStatusForCurrentUser(event);
    const requestedMemberIds = meta.requestedMemberIds ?? [];
    const responses = meta.responses ?? {};
    const requestLabel =
      meta.requestParticipation && requestedMemberIds.length
        ? `\n${isGerman ? "Anfragen an" : "Requests to"}: ${requestedMemberIds
            .map(getMemberLabel)
            .join(", ")}`
        : "";

    const responseGroups = {
      yes: requestedMemberIds.filter((memberId) => responses[memberId] === "yes"),
      no: requestedMemberIds.filter((memberId) => responses[memberId] === "no"),
      pending: requestedMemberIds.filter(
        (memberId) => !responses[memberId] || responses[memberId] === "pending"
      ),
    };

    const responseSummary =
      meta.requestParticipation && requestedMemberIds.length > 0 ? (
        <View style={styles.responseSummary}>
          <Text variant="labelMedium" style={styles.responseSummaryTitle}>
            {isGerman ? "Teilnahme-Status" : "Participation status"}
          </Text>

          <Text variant="bodySmall">
            <Text style={styles.responseLabelYes}>{isGerman ? "Zugesagt:" : "Yes:"}</Text>{" "}
            {responseGroups.yes.length > 0
              ? responseGroups.yes.map(getMemberLabel).join(", ")
              : (isGerman ? "niemand" : "none")}
          </Text>

          <Text variant="bodySmall">
            <Text style={styles.responseLabelPending}>{isGerman ? "Offen:" : "Open:"}</Text>{" "}
            {responseGroups.pending.length > 0
              ? responseGroups.pending.map(getMemberLabel).join(", ")
              : (isGerman ? "niemand" : "none")}
          </Text>

          <Text variant="bodySmall">
            <Text style={styles.responseLabelNo}>{isGerman ? "Abgesagt:" : "Declined:"}</Text>{" "}
            {responseGroups.no.length > 0
              ? responseGroups.no.map(getMemberLabel).join(", ")
              : (isGerman ? "niemand" : "none")}
          </Text>
        </View>
      ) : null;

    const responseLabel =
      requestStatus !== null
        ? `\n${isGerman ? "Dein Status" : "Your status"}: ${
            requestStatus === "yes"
              ? (isGerman ? "zugesagt" : "yes")
              : requestStatus === "no"
                ? (isGerman ? "abgelehnt" : "declined")
                : (isGerman ? "offen" : "open")
          }`
        : "";

    return (
      <View key={event.id} style={styles.currentDayEvent}>
        <View style={styles.currentDayBadgeRow}>
          <Text variant="labelSmall" style={styles.currentDayBadge}>
            {selectedEventBadgeLabel}
          </Text>
        </View>
        <List.Item
          title={event.title}
          description={`${getEventDateRangeLabel(event, locale)}${
            event.location ? `\n${isGerman ? "Ort" : "Location"}: ${event.location}` : ""
          }\n${creatorLine}${
            meta.notes ? `\n${isGerman ? "Notiz" : "Note"}: ${meta.notes}` : ""
          }${requestLabel}${responseLabel}`}
          left={(props) => (
            <List.Icon
              {...props}
              icon={isExternal ? "calendar-import" : "calendar-clock"}
              color={creatorColor}
            />
          )}
          right={() => isExternal ? null : (
            <View style={styles.eventActions}>
              {requestStatus === "pending" && (
                <>
                  <Button
                    mode="text"
                    loading={respondingEventId === event.id}
                    onPress={() => {
                      void respondToEvent(event, "yes");
                    }}
                  >
                    {isGerman ? "Zusagen" : "Yes"}
                  </Button>
                  <Button
                    mode="text"
                    loading={respondingEventId === event.id}
                    onPress={() => {
                      void respondToEvent(event, "no");
                    }}
                  >
                    {isGerman ? "Absagen" : "No"}
                  </Button>
                </>
              )}
              <Button mode="text" onPress={() => openEditDialog(event)}>
                {isGerman ? "Bearbeiten" : "Edit"}
              </Button>
              <Button mode="text" onPress={() => removeEvent(event)}>
                {isGerman ? "Löschen" : "Delete"}
              </Button>
            </View>
          )}
        />
        {responseSummary}
        <Divider />
      </View>
    );
  });

  const upcomingEventViews = upcomingEvents.map((event) => {
    const isExternal = isImportedEvent(event);
    const meta = getEventMeta(event);
    const creatorLabel = isExternal
      ? getSubscriptionLabel(event.subscription)
      : getMemberLabel(event.createdBy ?? "");
    const creatorColor = isExternal
      ? EXTERNAL_CALENDAR_COLOR
      : getMemberColor(event.createdBy ?? "");
    const creatorLine = isExternal
      ? `${t("profile.externalCalendarName")}: ${creatorLabel}`
      : `${isGerman ? "Erstellt von" : "Created by"}: ${creatorLabel}`;
    const requestStatus = getRequestStatusForCurrentUser(event);

    return (
      <View key={event.id}>
        <List.Item
          title={event.title}
          description={`${getEventDateRangeLabel(event, locale, {
            includeSingleDayDate: true,
          })}${
            event.location ? `\n${isGerman ? "Ort" : "Location"}: ${event.location}` : ""
          }\n${creatorLine}${
            meta.requestParticipation
              ? `\n${isGerman ? "Anfragen" : "Requests"}: ${meta.requestedMemberIds?.length ?? 0}`
              : ""
          }${
            requestStatus !== null
              ? `\n${isGerman ? "Dein Status" : "Your status"}: ${
                  requestStatus === "yes"
                    ? (isGerman ? "zugesagt" : "yes")
                    : requestStatus === "no"
                      ? (isGerman ? "abgelehnt" : "declined")
                      : (isGerman ? "offen" : "open")
                }`
              : ""
          }`}
          left={(props) => (
            <List.Icon
              {...props}
              icon={isExternal ? "calendar-import" : "calendar-month"}
              color={creatorColor}
            />
          )}
          right={() =>
            requestStatus === "pending" ? (
              <View style={styles.eventActions}>
                <Button
                  mode="text"
                  loading={respondingEventId === event.id}
                  onPress={() => {
                    void respondToEvent(event, "yes");
                  }}
                >
                  {isGerman ? "Zusagen" : "Yes"}
                </Button>
                <Button
                  mode="text"
                  loading={respondingEventId === event.id}
                  onPress={() => {
                    void respondToEvent(event, "no");
                  }}
                >
                  {isGerman ? "Absagen" : "No"}
                </Button>
              </View>
            ) : null
          }
        />
        <Divider />
      </View>
    );
  });

  return (
    <AppScreen
      title={isGerman ? "Kalender" : "Calendar"}
      right={
        <CalendarDisplayDropdown
          subscriptions={calendarSubscriptions}
          selectedHouseholdIds={selectedHouseholdIds}
          selectedSubscriptionIds={selectedSubscriptionIds}
          onToggleHousehold={toggleSelectedHousehold}
          onToggleSubscription={toggleSelectedSubscription}
        />
      }
      browserTitle={isGerman ? "Othello-Cloud | Kalender" : "Othello-Cloud | Calendar"}
    >
      <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
        <Card style={[layout.card, isWide && layout.wideForm]}>
          <Card.Title title={isGerman ? "Monatsansicht" : "Month view"} />
          <Card.Content>
            <View style={styles.calendarActions}>
              <Button mode="outlined" onPress={openCreateDialog}>
                {isGerman ? "Termin hinzufügen" : "Add event"}
              </Button>
              <Button mode="outlined" onPress={() => setColorConfigVisible(true)}>
                {isGerman ? "Farben" : "Colors"}
              </Button>
            </View>

            <Calendar
              key={`${theme.dark ? "dark" : "light"}-${language}`}
              firstDay={1}
              markedDates={markedDates}
              onDayPress={handleDayPress}
              onMonthChange={handleMonthChange}
              enableSwipeMonths
              markingType="multi-period"
              theme={calendarTheme}
            />
          </Card.Content>
        </Card>

        <View style={[layout.stack, isWide && layout.widePanel]}>
          <Card style={layout.card}>
            <Card.Title
              title={isGerman ? "Anstehende Termine" : "Upcoming events"}
              subtitle={
                selectedEvents.length + upcomingEvents.length > 0
                  ? `${selectedEvents.length + upcomingEvents.length} ${
                      isGerman ? "anstehende Termine" : "upcoming events"
                    }`
                  : (isGerman ? "Keine weiteren Termine" : "No further events")
              }
            />
            <Card.Content style={layout.listCardContent}>
              {selectedEvents.length + upcomingEvents.length === 0 && (
                <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                  {isGerman ? "Es stehen noch keine weiteren Termine an." : "There are no further events yet."}
                </Text>
              )}

              {selectedEvents.length + upcomingEvents.length > 0 && (
                <ScrollView
                  nestedScrollEnabled
                  style={!isWide && styles.mobileCardList}
                >
                  {selectedEventViews}
                  {upcomingEventViews}
                </ScrollView>
              )}
            </Card.Content>
          </Card>
        </View>
      </View>

      <Portal>
        <Dialog
          visible={createDialogVisible}
          onDismiss={() => setCreateDialogVisible(false)}
        >
          <Dialog.Title>
            {isGerman ? "Neuer Termin am" : "New event on"} {formatDateKey(newStartDate, locale)}
          </Dialog.Title>

          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
              <TextInput
                label={isGerman ? "Titel" : "Title"}
                value={newTitle}
                onChangeText={setNewTitle}
                mode="outlined"
                style={{ marginBottom: 12 }}
              />

              <Button
                mode="outlined"
                onPress={() => setStartDatePickerVisible(true)}
                style={{ marginBottom: 12 }}
              >
                {isGerman ? "Startdatum:" : "Start date:"}{" "}
                {formatDateKey(newStartDate, locale)}
              </Button>

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextBlock}>
                  <Text variant="titleSmall">{isGerman ? "Ganztägig" : "All-day event"}</Text>
                  <Text variant="bodySmall" style={{ opacity: 0.75 }}>
                    {isGerman ? "Ohne Start- oder Endzeit speichern." : "Save without a start or end time."}
                  </Text>
                </View>
                <Switch value={newAllDay} onValueChange={setNewAllDay} />
              </View>

              {!newAllDay && (
                <>
                  <Button
                    mode="outlined"
                    onPress={() => openTimePicker("start")}
                    style={{ marginBottom: 12 }}
                  >
                    {isGerman ? "Startzeit:" : "Start time:"} {newTime}
                  </Button>

                  <Button
                    mode="outlined"
                    onPress={() => openTimePicker("end")}
                    style={{ marginBottom: 12 }}
                  >
                    {isGerman ? "Endzeit:" : "End time:"} {newEndTime}
                  </Button>
                </>
              )}

              <Button
                mode="outlined"
                onPress={() => setEndDatePickerVisible(true)}
                style={{ marginBottom: 12 }}
              >
                {isGerman ? "Enddatum:" : "End date:"}{" "}
                {newEndDate
                  ? formatDateKey(newEndDate, locale)
                  : `${isGerman ? "gleicher Tag" : "same day"} (${formatDateKey(newStartDate, locale)})`}
              </Button>

              {newEndDate !== "" && (
                <Button
                  mode="text"
                  onPress={() => setNewEndDate("")}
                  style={{ marginBottom: 12 }}
                >
                  {isGerman ? "Enddatum zurücksetzen" : "Reset end date"}
                </Button>
              )}

              <TextInput
                label={isGerman ? "Ort optional" : "Location optional"}
                value={newLocation}
                onChangeText={setNewLocation}
                mode="outlined"
              />

              <TextInput
                label={isGerman ? "Notiz optional" : "Note optional"}
                value={newNotes}
                onChangeText={setNewNotes}
                mode="outlined"
                multiline
                style={{ marginTop: 12 }}
              />

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextBlock}>
                  <Text variant="titleSmall">{isGerman ? "Andere Mitglieder anfragen" : "Request other members"}</Text>
                  <Text variant="bodySmall" style={{ opacity: 0.75 }}>
                    {isGerman ? "Die ausgewählten Personen sehen den Termin als Anfrage." : "The selected people see the event as a request."}
                  </Text>
                </View>
                <Switch
                  value={newRequestParticipation}
                  onValueChange={setNewRequestParticipation}
                />
              </View>

              {newRequestParticipation && (
                <View style={styles.requestList}>
                  {creatorOptions.map((member) => (
                    <Button
                      key={member.userId}
                      mode={
                        newRequestedMemberIds.includes(member.userId)
                          ? "contained"
                          : "outlined"
                      }
                      onPress={() => toggleRequestedMember(member.userId)}
                      style={styles.requestChip}
                    >
                      {member.name || member.email}
                    </Button>
                  ))}
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>
              {isGerman ? "Abbrechen" : "Cancel"}
            </Button>
            <Button onPress={addEvent}>{isGerman ? "Speichern" : "Save"}</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={editingEvent !== null} onDismiss={closeEditDialog}>
          <Dialog.Title>{isGerman ? "Termin bearbeiten" : "Edit event"}</Dialog.Title>

          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
              <TextInput
                label={isGerman ? "Titel" : "Title"}
                value={newTitle}
                onChangeText={setNewTitle}
                mode="outlined"
                style={{ marginBottom: 12 }}
              />

              <Button
                mode="outlined"
                onPress={() => setEditStartDatePickerVisible(true)}
                style={{ marginBottom: 12 }}
              >
                {isGerman ? "Startdatum:" : "Start date:"}{" "}
                {formatDateKey(newStartDate, locale)}
              </Button>

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextBlock}>
                  <Text variant="titleSmall">{isGerman ? "Ganztägig" : "All-day event"}</Text>
                  <Text variant="bodySmall" style={{ opacity: 0.75 }}>
                    {isGerman ? "Ohne Start- oder Endzeit speichern." : "Save without a start or end time."}
                  </Text>
                </View>
                <Switch value={newAllDay} onValueChange={setNewAllDay} />
              </View>

              {!newAllDay && (
                <>
                  <Button
                    mode="outlined"
                    onPress={() => openTimePicker("start")}
                    style={{ marginBottom: 12 }}
                  >
                    {isGerman ? "Startzeit:" : "Start time:"} {newTime}
                  </Button>

                  <Button
                    mode="outlined"
                    onPress={() => openTimePicker("end")}
                    style={{ marginBottom: 12 }}
                  >
                    {isGerman ? "Endzeit:" : "End time:"} {newEndTime}
                  </Button>
                </>
              )}

              <Button
                mode="outlined"
                onPress={() => setEditEndDatePickerVisible(true)}
                style={{ marginBottom: 12 }}
              >
                {isGerman ? "Enddatum:" : "End date:"}{" "}
                {newEndDate
                  ? formatDateKey(newEndDate, locale)
                  : `${isGerman ? "gleicher Tag" : "same day"} (${formatDateKey(newStartDate, locale)})`}
              </Button>

              {newEndDate !== "" && (
                <Button
                  mode="text"
                  onPress={() => setNewEndDate("")}
                  style={{ marginBottom: 12 }}
                >
                  {isGerman ? "Enddatum zurücksetzen" : "Reset end date"}
                </Button>
              )}

              <TextInput
                label={isGerman ? "Ort optional" : "Location optional"}
                value={newLocation}
                onChangeText={setNewLocation}
                mode="outlined"
              />

              <TextInput
                label={isGerman ? "Notiz optional" : "Note optional"}
                value={newNotes}
                onChangeText={setNewNotes}
                mode="outlined"
                multiline
                style={{ marginTop: 12 }}
              />

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextBlock}>
                  <Text variant="titleSmall">{isGerman ? "Andere Mitglieder anfragen" : "Request other members"}</Text>
                  <Text variant="bodySmall" style={{ opacity: 0.75 }}>
                    {isGerman ? "Die ausgewählten Personen sehen den Termin als Anfrage." : "The selected people see the event as a request."}
                  </Text>
                </View>
                <Switch
                  value={newRequestParticipation}
                  onValueChange={setNewRequestParticipation}
                />
              </View>

              {newRequestParticipation && (
                <View style={styles.requestList}>
                  {creatorOptions.map((member) => (
                    <Button
                      key={member.userId}
                      mode={
                        newRequestedMemberIds.includes(member.userId)
                          ? "contained"
                          : "outlined"
                      }
                      onPress={() => toggleRequestedMember(member.userId)}
                      style={styles.requestChip}
                    >
                      {member.name || member.email}
                    </Button>
                  ))}
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions>
            <Button onPress={closeEditDialog}>{isGerman ? "Abbrechen" : "Cancel"}</Button>
            <Button onPress={saveEditedEvent}>{isGerman ? "Speichern" : "Save"}</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={startDatePickerVisible}
          onDismiss={() => setStartDatePickerVisible(false)}
        >
          <Dialog.Title>{isGerman ? "Startdatum auswählen" : "Choose start date"}</Dialog.Title>

          <Dialog.Content>
            <Calendar
              key={theme.dark ? "dark" : "light"}
              firstDay={1}
              current={newStartDate}
              markedDates={{
                [newStartDate]: {
                  selected: true,
                  selectedColor: theme.colors.primary,
                },
              }}
              onDayPress={(day) => {
                changeNewStartDate(day.dateString);
                setStartDatePickerVisible(false);
              }}
              theme={calendarTheme}
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setStartDatePickerVisible(false)}>
              {isGerman ? "Abbrechen" : "Cancel"}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={timePickerTarget !== null}
          onDismiss={() => setTimePickerTarget(null)}
        >
          <Dialog.Title>
            {timePickerTarget === "end"
              ? isGerman
                ? "Endzeit waehlen"
                : "Choose end time"
              : isGerman
                ? "Startzeit waehlen"
                : "Choose start time"}
          </Dialog.Title>

          <Dialog.Content>
            <View style={styles.timePickerPanel}>
              <Text variant="displaySmall" style={styles.timePickerValue}>
                {draftTime}
              </Text>

              <View style={styles.timePickerControls}>
                <View style={styles.timePickerColumn}>
                  <Text variant="labelLarge">
                    {isGerman ? "Stunde" : "Hour"}
                  </Text>
                  <Button
                    mode="outlined"
                    accessibilityLabel={`${
                      timePickerTarget === "end" ? "Endzeit" : "Startzeit"
                    } Stunde erhoehen`}
                    onPress={() => setDraftTime((time) => shiftTimeInput(time, 60))}
                  >
                    +
                  </Button>
                  <Button
                    mode="outlined"
                    accessibilityLabel={`${
                      timePickerTarget === "end" ? "Endzeit" : "Startzeit"
                    } Stunde verringern`}
                    onPress={() => setDraftTime((time) => shiftTimeInput(time, -60))}
                  >
                    -
                  </Button>
                </View>

                <View style={styles.timePickerColumn}>
                  <Text variant="labelLarge">
                    {isGerman ? "Minute" : "Minute"}
                  </Text>
                  <Button
                    mode="outlined"
                    accessibilityLabel={`${
                      timePickerTarget === "end" ? "Endzeit" : "Startzeit"
                    } Minute erhoehen`}
                    onPress={() => setDraftTime((time) => shiftTimeInput(time, 5))}
                  >
                    +5
                  </Button>
                  <Button
                    mode="outlined"
                    accessibilityLabel={`${
                      timePickerTarget === "end" ? "Endzeit" : "Startzeit"
                    } Minute verringern`}
                    onPress={() => setDraftTime((time) => shiftTimeInput(time, -5))}
                  >
                    -5
                  </Button>
                </View>
              </View>
            </View>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setTimePickerTarget(null)}>
              {isGerman ? "Abbrechen" : "Cancel"}
            </Button>
            <Button onPress={confirmTimePicker}>OK</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={endDatePickerVisible}
          onDismiss={() => setEndDatePickerVisible(false)}
        >
          <Dialog.Title>{isGerman ? "Enddatum auswählen" : "Choose end date"}</Dialog.Title>

          <Dialog.Content>
            <Calendar
              key={theme.dark ? "dark" : "light"}
              firstDay={1}
              current={newEndDate || newStartDate}
              minDate={newStartDate}
              markedDates={{
                [newStartDate]: {
                  marked: true,
                  dotColor: theme.colors.primary,
                },
                [newEndDate || newStartDate]: {
                  selected: true,
                  selectedColor: theme.colors.primary,
                },
              }}
              onDayPress={(day) => {
                setNewEndDate(
                  day.dateString === newStartDate ? "" : day.dateString
                );
                setEndDatePickerVisible(false);
              }}
              theme={calendarTheme}
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={() => {
                setNewEndDate("");
                setEndDatePickerVisible(false);
              }}
            >
              {isGerman ? "Gleicher Tag" : "Same day"}
            </Button>
            <Button onPress={() => setEndDatePickerVisible(false)}>
              {isGerman ? "Abbrechen" : "Cancel"}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={editStartDatePickerVisible}
          onDismiss={() => setEditStartDatePickerVisible(false)}
        >
          <Dialog.Title>{isGerman ? "Startdatum auswählen" : "Choose start date"}</Dialog.Title>

          <Dialog.Content>
            <Calendar
              key={theme.dark ? "dark" : "light"}
              firstDay={1}
              current={newStartDate}
              markedDates={{
                [newStartDate]: {
                  selected: true,
                  selectedColor: theme.colors.primary,
                },
              }}
              onDayPress={(day) => {
                changeNewStartDate(day.dateString);
                setEditStartDatePickerVisible(false);
              }}
              theme={calendarTheme}
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setEditStartDatePickerVisible(false)}>
              {isGerman ? "Abbrechen" : "Cancel"}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={editEndDatePickerVisible}
          onDismiss={() => setEditEndDatePickerVisible(false)}
        >
          <Dialog.Title>{isGerman ? "Enddatum auswählen" : "Choose end date"}</Dialog.Title>

          <Dialog.Content>
            <Calendar
              key={theme.dark ? "dark" : "light"}
              firstDay={1}
              current={newEndDate || newStartDate}
              minDate={newStartDate}
              markedDates={{
                [newStartDate]: {
                  marked: true,
                  dotColor: theme.colors.primary,
                },
                [newEndDate || newStartDate]: {
                  selected: true,
                  selectedColor: theme.colors.primary,
                },
              }}
              onDayPress={(day) => {
                const baseDateKey = newStartDate;
                setNewEndDate(day.dateString === baseDateKey ? "" : day.dateString);
                setEditEndDatePickerVisible(false);
              }}
              theme={calendarTheme}
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={() => {
                setNewEndDate("");
                setEditEndDatePickerVisible(false);
              }}
            >
              {isGerman ? "Gleicher Tag" : "Same day"}
            </Button>
            <Button onPress={() => setEditEndDatePickerVisible(false)}>
              {isGerman ? "Abbrechen" : "Cancel"}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={colorConfigVisible}
          onDismiss={() => setColorConfigVisible(false)}
        >
          <Dialog.Title>{isGerman ? "Farben pro Person" : "Colors per person"}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
              {members.length === 0 && (
                <Text variant="bodyMedium">
                  {isGerman ? "Keine Mitglieder geladen." : "No members loaded."}
                </Text>
              )}

              {members.map((member) => (
                <View key={member.userId} style={styles.colorRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall">
                      {member.name || member.email}
                    </Text>
                    <Text variant="bodySmall" style={{ opacity: 0.75 }}>
                      {isGerman
                        ? "Veranstaltungen von dieser Person nutzen diese Farbe."
                        : "Events from this person use this color."}
                    </Text>
                  </View>

                  <View style={styles.paletteRow}>
                    {DEFAULT_COLOR_PALETTE.map((color) => (
                      <Button
                        key={color}
                        mode={
                          getMemberColor(member.userId) === color
                            ? "contained"
                            : "outlined"
                        }
                        onPress={() => setMemberColor(member.userId, color)}
                        compact
                        style={[
                          styles.colorSwatchButton,
                          { borderColor: color },
                        ]}
                        buttonColor={
                          getMemberColor(member.userId) === color ? color : undefined
                        }
                        textColor={
                          getMemberColor(member.userId) === color
                            ? theme.colors.onPrimary
                            : color
                        }
                      >
                        <Text style={[styles.colorSwatchText, { color }]}>■</Text>
                      </Button>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setColorConfigVisible(false)}>
              {isGerman ? "Schließen" : "Close"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  calendarActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  toggleTextBlock: {
    flex: 1,
    gap: 2,
  },
  requestList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  requestChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  timePickerPanel: {
    alignItems: "center",
    gap: 18,
    paddingVertical: 8,
  },
  timePickerValue: {
    fontVariant: ["tabular-nums"],
  },
  timePickerControls: {
    flexDirection: "row",
    gap: 18,
    justifyContent: "center",
  },
  timePickerColumn: {
    alignItems: "center",
    gap: 8,
    minWidth: 96,
  },
  currentDayEvent: {
    borderLeftWidth: 3,
    borderLeftColor: EXTERNAL_CALENDAR_COLOR,
    backgroundColor: "rgba(15, 118, 110, 0.08)",
  },
  currentDayBadgeRow: {
    alignItems: "flex-start",
    paddingLeft: 16,
    paddingTop: 10,
  },
  currentDayBadge: {
    borderRadius: 6,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: EXTERNAL_CALENDAR_COLOR,
    color: "#ffffff",
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  paletteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
    maxWidth: 170,
  },
  colorSwatchButton: {
    minWidth: 34,
    paddingHorizontal: 0,
  },
  colorSwatchText: {
    fontSize: 18,
    lineHeight: 18,
  },
  responseSummary: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 4,
  },
  responseSummaryTitle: {
    opacity: 0.85,
    marginBottom: 2,
  },
  responseLabelYes: {
    color: "#16a34a",
    fontWeight: "700",
  },
  responseLabelPending: {
    color: "#ca8a04",
    fontWeight: "700",
  },
  responseLabelNo: {
    color: "#dc2626",
    fontWeight: "700",
  },
  eventActions: {
    alignItems: "flex-end",
    gap: 2,
  },
  mobileCardList: {
    maxHeight: 360,
  },
});
