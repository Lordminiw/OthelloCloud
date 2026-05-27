import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";
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
import {
  CalendarEvent,
  createCalendarEvent,
  deleteCalendarEvent,
  loadCalendarEventsForMonth,
  parseCalendarEventMeta,
  updateCalendarEvent,
} from "../lib/calendar";
import { HouseholdDropdown } from "@/components/household-dropdown";
import { pb } from "../lib/pocketbase";
import { HouseholdMember, loadHouseholdMembers } from "../lib/members";

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

LocaleConfig.defaultLocale = "de";

type CalendarScreenProps = {
  householdId: string;
};

type RequestResponse = "pending" | "yes" | "no";

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

function getEventDateKey(event: CalendarEvent) {
  return toDateKeyFromIso(event.start);
}

function getEventEndDateKey(event: CalendarEvent) {
  if (!event.end) {
    return getEventDateKey(event);
  }

  return toDateKeyFromIso(event.end);
}

function getEventTimeLabel(event: CalendarEvent) {
  return new Date(event.start).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEventEndTimeLabel(event: CalendarEvent) {
  if (!event.end) {
    return "";
  }

  return new Date(event.end).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeInput(dateIso: string) {
  const date = new Date(dateIso);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
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

function eventTouchesDate(event: CalendarEvent, dateKey: string) {
  const startKey = getEventDateKey(event);
  const endKey = getEventEndDateKey(event);

  return dateKey >= startKey && dateKey <= endKey;
}

function getEffectiveEndDateKey(selectedDateKey: string, newEndDate: string) {
  return newEndDate.trim() || selectedDateKey;
}

function formatDateKeyGerman(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getEventDateRangeLabel(event: CalendarEvent) {
  const startKey = getEventDateKey(event);
  const endKey = getEventEndDateKey(event);
  const startTime = getEventTimeLabel(event);
  const endTime = getEventEndTimeLabel(event);

  if (startKey === endKey) {
    return endTime ? `${startTime} – ${endTime}` : startTime;
  }

  return `${formatDateKeyGerman(startKey)} ${startTime} – ${formatDateKeyGerman(
    endKey
  )}${endTime ? ` ${endTime}` : ""}`;
}

function getStorageKey(householdId: string, suffix: string) {
  return `calendar:${householdId}:${suffix}`;
}

export function CalendarScreen({ householdId }: CalendarScreenProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toDateKey(new Date())
  );

  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [endDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editEndDatePickerVisible, setEditEndDatePickerVisible] =
    useState(false);
  const [colorConfigVisible, setColorConfigVisible] = useState(false);
  const [respondingEventId, setRespondingEventId] = useState<string | null>(
    null
  );

  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("19:00");
  const [newEndDate, setNewEndDate] = useState("");
  const [newEndTime, setNewEndTime] = useState("20:00");
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
        const records = await loadCalendarEventsForMonth({
          householdId,
          year: date.getFullYear(),
          month: date.getMonth(),
        });

        setEvents(records);
      } catch (error: any) {
        console.log("CALENDAR LOAD ERROR:", error);
        console.log("STATUS:", error?.status);
        console.log("MESSAGE:", error?.message);
        console.log("RESPONSE:", error?.response);
        alert(JSON.stringify(error?.response, null, 2));
      }
    },
    [householdId, visibleMonth]
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
      const color = getMemberColor(event.createdBy ?? "");

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

  function handleMonthChange(month: DateData) {
    setVisibleMonth(new Date(month.year, month.month - 1, 1));
  }

  function handleDayPress(day: DateData) {
    setSelectedDateKey(day.dateString);
  }

  function jumpToToday() {
    const todayKey = toDateKey(new Date());
    setSelectedDateKey(todayKey);
    setVisibleMonth(new Date());
  }

  function openCreateDialog() {
    setNewTitle("");
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
    setEditEndDatePickerVisible(false);
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
      alert("Bitte Titel eingeben.");
      return;
    }

    if (!/^\d\d:\d\d$/.test(newTime)) {
      alert("Bitte Start-Uhrzeit im Format HH:MM eingeben.");
      return;
    }

    if (!/^\d\d:\d\d$/.test(newEndTime)) {
      alert("Bitte End-Uhrzeit im Format HH:MM eingeben.");
      return;
    }

    const endDateKey = getEffectiveEndDateKey(selectedDateKey, newEndDate);
    const startIso = makeLocalIso(selectedDateKey, newTime);
    const endIso = makeLocalIso(endDateKey, newEndTime);

    if (new Date(endIso) < new Date(startIso)) {
      alert("Das Ende darf nicht vor dem Start liegen.");
      return;
    }

    try {
      await createCalendarEvent({
        householdId,
        title: newTitle.trim(),
        startIso,
        endIso,
        location: newLocation.trim(),
        notes: newNotes.trim(),
        requestParticipation: newRequestParticipation,
        requestedMemberIds: newRequestedMemberIds,
        responses: newRequestParticipation
          ? buildPendingResponses(newRequestedMemberIds)
          : undefined,
      });

      setNewTitle("");
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
      alert("Bitte Titel eingeben.");
      return;
    }

    if (!/^\d\d:\d\d$/.test(newTime)) {
      alert("Bitte Start-Uhrzeit im Format HH:MM eingeben.");
      return;
    }

    if (!/^\d\d:\d\d$/.test(newEndTime)) {
      alert("Bitte End-Uhrzeit im Format HH:MM eingeben.");
      return;
    }

    const startDateKey = getEventDateKey(editingEvent);
    const endDateKey = getEffectiveEndDateKey(startDateKey, newEndDate);
    const startIso = makeLocalIso(startDateKey, newTime);
    const endIso = makeLocalIso(endDateKey, newEndTime);

    if (new Date(endIso) < new Date(startIso)) {
      alert("Das Ende darf nicht vor dem Start liegen.");
      return;
    }

    try {
      await updateCalendarEvent(editingEvent.id, {
        title: newTitle.trim(),
        startIso,
        endIso,
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
    const meta = getEventMeta(event);
    const creatorLabel = getMemberLabel(event.createdBy ?? "");
    const creatorColor = getMemberColor(event.createdBy ?? "");
    const requestStatus = getRequestStatusForCurrentUser(event);
    const requestedMemberIds = meta.requestedMemberIds ?? [];
    const responses = meta.responses ?? {};
    const requestLabel =
      meta.requestParticipation && requestedMemberIds.length
        ? `\nAnfragen an: ${requestedMemberIds
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
            Teilnahme-Status
          </Text>

          <Text variant="bodySmall">
            <Text style={styles.responseLabelYes}>Zugesagt:</Text>{" "}
            {responseGroups.yes.length > 0
              ? responseGroups.yes.map(getMemberLabel).join(", ")
              : "niemand"}
          </Text>

          <Text variant="bodySmall">
            <Text style={styles.responseLabelPending}>Offen:</Text>{" "}
            {responseGroups.pending.length > 0
              ? responseGroups.pending.map(getMemberLabel).join(", ")
              : "niemand"}
          </Text>

          <Text variant="bodySmall">
            <Text style={styles.responseLabelNo}>Abgesagt:</Text>{" "}
            {responseGroups.no.length > 0
              ? responseGroups.no.map(getMemberLabel).join(", ")
              : "niemand"}
          </Text>
        </View>
      ) : null;

    const responseLabel =
      requestStatus !== null
        ? `\nDein Status: ${
            requestStatus === "yes"
              ? "zugesagt"
              : requestStatus === "no"
                ? "abgelehnt"
                : "offen"
          }`
        : "";

    return (
      <View key={event.id}>
        <List.Item
          title={event.title}
          description={`${getEventDateRangeLabel(event)}${
            event.location ? `\nOrt: ${event.location}` : ""
          }\nErstellt von: ${creatorLabel}${
            meta.notes ? `\nNotiz: ${meta.notes}` : ""
          }${requestLabel}${responseLabel}`}
          left={(props) => (
            <List.Icon {...props} icon="calendar-clock" color={creatorColor} />
          )}
          right={() => (
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
                    Zusagen
                  </Button>
                  <Button
                    mode="text"
                    loading={respondingEventId === event.id}
                    onPress={() => {
                      void respondToEvent(event, "no");
                    }}
                  >
                    Absagen
                  </Button>
                </>
              )}
              <Button mode="text" onPress={() => openEditDialog(event)}>
                Bearbeiten
              </Button>
              <Button mode="text" onPress={() => removeEvent(event)}>
                Löschen
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
    const meta = getEventMeta(event);
    const creatorLabel = getMemberLabel(event.createdBy ?? "");
    const creatorColor = getMemberColor(event.createdBy ?? "");
    const requestStatus = getRequestStatusForCurrentUser(event);

    return (
      <View key={event.id}>
        <List.Item
          title={event.title}
          description={`${getEventDateRangeLabel(event)}${
            event.location ? `\nOrt: ${event.location}` : ""
          }\nErstellt von: ${creatorLabel}${
            meta.requestParticipation
              ? `\nAnfragen: ${meta.requestedMemberIds?.length ?? 0}`
              : ""
          }${
            requestStatus !== null
              ? `\nDein Status: ${
                  requestStatus === "yes"
                    ? "zugesagt"
                    : requestStatus === "no"
                      ? "abgelehnt"
                      : "offen"
                }`
              : ""
          }`}
          left={(props) => (
            <List.Icon {...props} icon="calendar-month" color={creatorColor} />
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
                  Zusagen
                </Button>
                <Button
                  mode="text"
                  loading={respondingEventId === event.id}
                  onPress={() => {
                    void respondToEvent(event, "no");
                  }}
                >
                  Absagen
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
    <AppScreen title="Kalender" right={<HouseholdDropdown />}>
      <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
        <Card style={[layout.card, isWide && layout.wideForm]}>
          <Card.Title title="Monatsansicht" />
          <Card.Content>
            <View style={styles.calendarActions}>
              <Button mode="outlined" onPress={jumpToToday}>
                Heute
              </Button>
              <Button mode="outlined" onPress={openCreateDialog}>
                Termin hinzufügen
              </Button>
              <Button mode="outlined" onPress={() => setColorConfigVisible(true)}>
                Farben
              </Button>
            </View>

            <Calendar
              key={theme.dark ? "dark" : "light"}
              firstDay={1}
              markedDates={markedDates}
              onDayPress={handleDayPress}
              onMonthChange={handleMonthChange}
              enableSwipeMonths
              markingType="multi-period"
              theme={{
                calendarBackground: theme.colors.surface,
                textSectionTitleColor: theme.colors.onSurface,
                dayTextColor: theme.colors.onSurface,
                monthTextColor: theme.colors.onSurface,
                arrowColor: theme.colors.primary,
                todayTextColor: theme.colors.primary,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.onPrimary,
                textDisabledColor: theme.dark ? "#555" : "#d9e1e8",
              }}
            />
          </Card.Content>
        </Card>

        <View style={[layout.stack, isWide && layout.widePanel]}>
          <Card style={layout.card}>
            <Card.Title
              title={`Agenda für ${formatDateKeyGerman(selectedDateKey)}`}
              subtitle={`${selectedEvents.length} Termin${
                selectedEvents.length === 1 ? "" : "e"
              } an diesem Tag`}
            />
            <Card.Content style={layout.listCardContent}>
              {selectedEvents.length === 0 && (
                <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                  Keine Termine an diesem Tag.
                </Text>
              )}

              {selectedEvents.length > 0 && (
                <ScrollView
                  nestedScrollEnabled
                  style={!isWide && styles.mobileCardList}
                >
                  {selectedEventViews}
                </ScrollView>
              )}
            </Card.Content>
          </Card>

          <Card style={layout.card}>
            <Card.Title
              title="Kommende Termine"
              subtitle={
                upcomingEvents.length > 0
                  ? `${upcomingEvents.length} bevorstehende Termine`
                  : "Keine weiteren Termine"
              }
            />
            <Card.Content style={layout.listCardContent}>
              {upcomingEvents.length === 0 && (
                <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                  Es stehen noch keine weiteren Termine an.
                </Text>
              )}

              {upcomingEvents.length > 0 && (
                <ScrollView
                  nestedScrollEnabled
                  style={!isWide && styles.mobileCardList}
                >
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
            Neuer Termin am {formatDateKeyGerman(selectedDateKey)}
          </Dialog.Title>

          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
              <TextInput
                label="Titel"
                value={newTitle}
                onChangeText={setNewTitle}
                mode="outlined"
                style={{ marginBottom: 12 }}
              />

              <TextInput
                label="Startzeit"
                value={newTime}
                onChangeText={setNewTime}
                mode="outlined"
                placeholder="19:00"
                style={{ marginBottom: 12 }}
              />

              <TextInput
                label="Endzeit"
                value={newEndTime}
                onChangeText={setNewEndTime}
                mode="outlined"
                placeholder="20:00"
                style={{ marginBottom: 12 }}
              />

              <Button
                mode="outlined"
                onPress={() => setEndDatePickerVisible(true)}
                style={{ marginBottom: 12 }}
              >
                Enddatum:{" "}
                {newEndDate
                  ? formatDateKeyGerman(newEndDate)
                  : `gleicher Tag (${formatDateKeyGerman(selectedDateKey)})`}
              </Button>

              {newEndDate !== "" && (
                <Button
                  mode="text"
                  onPress={() => setNewEndDate("")}
                  style={{ marginBottom: 12 }}
                >
                  Enddatum zurücksetzen
                </Button>
              )}

              <TextInput
                label="Ort optional"
                value={newLocation}
                onChangeText={setNewLocation}
                mode="outlined"
              />

              <TextInput
                label="Notiz optional"
                value={newNotes}
                onChangeText={setNewNotes}
                mode="outlined"
                multiline
                style={{ marginTop: 12 }}
              />

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextBlock}>
                  <Text variant="titleSmall">Andere Mitglieder anfragen</Text>
                  <Text variant="bodySmall" style={{ opacity: 0.75 }}>
                    Die ausgewählten Personen sehen den Termin als Anfrage.
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
              Abbrechen
            </Button>
            <Button onPress={addEvent}>Speichern</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={editingEvent !== null} onDismiss={closeEditDialog}>
          <Dialog.Title>Termin bearbeiten</Dialog.Title>

          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
              <TextInput
                label="Titel"
                value={newTitle}
                onChangeText={setNewTitle}
                mode="outlined"
                style={{ marginBottom: 12 }}
              />

              <TextInput
                label="Startzeit"
                value={newTime}
                onChangeText={setNewTime}
                mode="outlined"
                placeholder="19:00"
                style={{ marginBottom: 12 }}
              />

              <TextInput
                label="Endzeit"
                value={newEndTime}
                onChangeText={setNewEndTime}
                mode="outlined"
                placeholder="20:00"
                style={{ marginBottom: 12 }}
              />

              <Button
                mode="outlined"
                onPress={() => setEditEndDatePickerVisible(true)}
                style={{ marginBottom: 12 }}
              >
                Enddatum:{" "}
                {newEndDate
                  ? formatDateKeyGerman(newEndDate)
                  : `gleicher Tag (${
                      editingEvent ? formatDateKeyGerman(getEventDateKey(editingEvent)) : formatDateKeyGerman(selectedDateKey)
                    })`}
              </Button>

              {newEndDate !== "" && (
                <Button
                  mode="text"
                  onPress={() => setNewEndDate("")}
                  style={{ marginBottom: 12 }}
                >
                  Enddatum zurücksetzen
                </Button>
              )}

              <TextInput
                label="Ort optional"
                value={newLocation}
                onChangeText={setNewLocation}
                mode="outlined"
              />

              <TextInput
                label="Notiz optional"
                value={newNotes}
                onChangeText={setNewNotes}
                mode="outlined"
                multiline
                style={{ marginTop: 12 }}
              />

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextBlock}>
                  <Text variant="titleSmall">Andere Mitglieder anfragen</Text>
                  <Text variant="bodySmall" style={{ opacity: 0.75 }}>
                    Die ausgewählten Personen sehen den Termin als Anfrage.
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
            <Button onPress={closeEditDialog}>Abbrechen</Button>
            <Button onPress={saveEditedEvent}>Speichern</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={endDatePickerVisible}
          onDismiss={() => setEndDatePickerVisible(false)}
        >
          <Dialog.Title>Enddatum auswählen</Dialog.Title>

          <Dialog.Content>
            <Calendar
              key={theme.dark ? "dark" : "light"}
              firstDay={1}
              current={newEndDate || selectedDateKey}
              minDate={selectedDateKey}
              markedDates={{
                [selectedDateKey]: {
                  marked: true,
                  dotColor: theme.colors.primary,
                },
                [newEndDate || selectedDateKey]: {
                  selected: true,
                  selectedColor: theme.colors.primary,
                },
              }}
              onDayPress={(day) => {
                setNewEndDate(
                  day.dateString === selectedDateKey ? "" : day.dateString
                );
                setEndDatePickerVisible(false);
              }}
              theme={{
                calendarBackground: theme.colors.surface,
                textSectionTitleColor: theme.colors.onSurface,
                dayTextColor: theme.colors.onSurface,
                monthTextColor: theme.colors.onSurface,
                arrowColor: theme.colors.primary,
                todayTextColor: theme.colors.primary,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.onPrimary,
                textDisabledColor: theme.dark ? "#555" : "#d9e1e8",
              }}
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={() => {
                setNewEndDate("");
                setEndDatePickerVisible(false);
              }}
            >
              Gleicher Tag
            </Button>
            <Button onPress={() => setEndDatePickerVisible(false)}>
              Abbrechen
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={editEndDatePickerVisible}
          onDismiss={() => setEditEndDatePickerVisible(false)}
        >
          <Dialog.Title>Enddatum auswählen</Dialog.Title>

          <Dialog.Content>
            <Calendar
              key={theme.dark ? "dark" : "light"}
              firstDay={1}
              current={newEndDate || (editingEvent ? getEventDateKey(editingEvent) : selectedDateKey)}
              minDate={editingEvent ? getEventDateKey(editingEvent) : selectedDateKey}
              markedDates={{
                [editingEvent ? getEventDateKey(editingEvent) : selectedDateKey]: {
                  marked: true,
                  dotColor: theme.colors.primary,
                },
                [newEndDate || (editingEvent ? getEventDateKey(editingEvent) : selectedDateKey)]: {
                  selected: true,
                  selectedColor: theme.colors.primary,
                },
              }}
              onDayPress={(day) => {
                const baseDateKey = editingEvent
                  ? getEventDateKey(editingEvent)
                  : selectedDateKey;
                setNewEndDate(day.dateString === baseDateKey ? "" : day.dateString);
                setEditEndDatePickerVisible(false);
              }}
              theme={{
                calendarBackground: theme.colors.surface,
                textSectionTitleColor: theme.colors.onSurface,
                dayTextColor: theme.colors.onSurface,
                monthTextColor: theme.colors.onSurface,
                arrowColor: theme.colors.primary,
                todayTextColor: theme.colors.primary,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.onPrimary,
                textDisabledColor: theme.dark ? "#555" : "#d9e1e8",
              }}
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={() => {
                setNewEndDate("");
                setEditEndDatePickerVisible(false);
              }}
            >
              Gleicher Tag
            </Button>
            <Button onPress={() => setEditEndDatePickerVisible(false)}>
              Abbrechen
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={colorConfigVisible}
          onDismiss={() => setColorConfigVisible(false)}
        >
          <Dialog.Title>Farben pro Person</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
              {members.length === 0 && (
                <Text variant="bodyMedium">Keine Mitglieder geladen.</Text>
              )}

              {members.map((member) => (
                <View key={member.userId} style={styles.colorRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall">
                      {member.name || member.email}
                    </Text>
                    <Text variant="bodySmall" style={{ opacity: 0.75 }}>
                      Veranstaltungen von dieser Person nutzen diese Farbe.
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
            <Button onPress={() => setColorConfigVisible(false)}>Schließen</Button>
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
