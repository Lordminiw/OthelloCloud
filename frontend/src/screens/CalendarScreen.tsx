import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";
import {
  Button,
  Card,
  Dialog,
  Divider,
  List,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import {
  CalendarEvent,
  createCalendarEvent,
  deleteCalendarEvent,
  loadCalendarEventsForMonth,
} from "../lib/calendar";
import { HouseholdDropdown } from "@/components/household-dropdown";

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

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function makeLocalIso(dateKey: string, time: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute).toISOString();
}

function getEventDateKey(event: CalendarEvent) {
  return event.start.slice(0, 10);
}

function getEventEndDateKey(event: CalendarEvent) {
  if (!event.end) {
    return getEventDateKey(event);
  }

  return event.end.slice(0, 10);
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
    if (endTime) {
      return `${startTime} – ${endTime}`;
    }

    return startTime;
  }

  return `${formatDateKeyGerman(startKey)} ${startTime} – ${formatDateKeyGerman(
    endKey
  )}${endTime ? ` ${endTime}` : ""}`;
}

export function CalendarScreen({ householdId }: CalendarScreenProps) {
  const theme = useTheme();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toDateKey(new Date())
  );

  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [endDatePickerVisible, setEndDatePickerVisible] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("19:00");
  const [newEndDate, setNewEndDate] = useState("");
  const [newEndTime, setNewEndTime] = useState("20:00");
  const [newLocation, setNewLocation] = useState("");

  async function reloadEvents(date = visibleMonth) {
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
  }

  useEffect(() => {
    reloadEvents();
  }, [householdId, visibleMonth]);

  const selectedEvents = useMemo(() => {
    return events.filter((event) => eventTouchesDate(event, selectedDateKey));
  }, [events, selectedDateKey]);

  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    for (const event of events) {
      const startKey = getEventDateKey(event);
      const endKey = getEventEndDateKey(event);
      const dateKeys = getDateKeysBetween(startKey, endKey);

      for (const key of dateKeys) {
        marked[key] = {
          ...(marked[key] ?? {}),
          marked: true,
          dotColor: theme.colors.primary,
        };
      }
    }

    marked[selectedDateKey] = {
      ...(marked[selectedDateKey] ?? {}),
      selected: true,
      selectedColor: theme.colors.primary,
    };

    return marked;
  }, [events, selectedDateKey, theme.colors.primary]);

  function handleMonthChange(month: DateData) {
    const nextVisibleMonth = new Date(month.year, month.month - 1, 1);
    setVisibleMonth(nextVisibleMonth);
  }

  function handleDayPress(day: DateData) {
    setSelectedDateKey(day.dateString);
  }

  function openCreateDialog() {
    setNewTitle("");
    setNewTime("19:00");
    setNewEndDate("");
    setNewEndTime("20:00");
    setNewLocation("");
    setCreateDialogVisible(true);
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
      });

      setNewTitle("");
      setNewTime("19:00");
      setNewEndDate("");
      setNewEndTime("20:00");
      setNewLocation("");

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

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="headlineMedium">Kalender</Text>
          <HouseholdDropdown />
        </View>

        <Card>
          <Card.Content>
            <Calendar
              key={theme.dark ? "dark" : "light"}
              firstDay={1}
              markedDates={markedDates}
              onDayPress={handleDayPress}
              onMonthChange={handleMonthChange}
              enableSwipeMonths
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
                selectedDotColor: theme.colors.onPrimary,
              }}
            />
          </Card.Content>
        </Card>

        <Card>
          <Card.Title
            title={`Termine am ${formatDateKeyGerman(selectedDateKey)}`}
          />
          <Card.Content>
            {selectedEvents.length === 0 && (
              <Text variant="bodyMedium">Keine Termine an diesem Tag.</Text>
            )}

            {selectedEvents.map((event) => (
              <View key={event.id}>
                <List.Item
                  title={event.title}
                  description={`${getEventDateRangeLabel(event)}${
                    event.location ? `\nOrt: ${event.location}` : ""
                  }`}
                  left={(props) => (
                    <List.Icon {...props} icon="calendar-clock" />
                  )}
                  right={() => (
                    <Button mode="text" onPress={() => removeEvent(event)}>
                      Löschen
                    </Button>
                  )}
                />
                <Divider />
              </View>
            ))}

            <Button
              mode="contained"
              onPress={openCreateDialog}
              style={{ marginTop: 12 }}
            >
              Termin hinzufügen
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

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
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>
              Abbrechen
            </Button>
            <Button onPress={addEvent}>Speichern</Button>
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
                selectedDotColor: theme.colors.onPrimary,
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
      </Portal>
    </View>
  );
}