import { useEffect, useMemo, useState } from "react";
import { Button, Modal, ScrollView, Text, TextInput, View } from "react-native";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";
import { CalendarEvent, createCalendarEvent, deleteCalendarEvent, loadCalendarEventsForMonth } from "../lib/calendar";

LocaleConfig.locales.de = {
  monthNames: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  monthNamesShort: ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."],
  dayNames: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  dayNamesShort: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  today: "Heute",
};

LocaleConfig.defaultLocale = "de";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function getEventDateKey(event: CalendarEvent) {
  return event.start.slice(0, 10);
}

function getEventTimeLabel(event: CalendarEvent) {
  return new Date(event.start).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function makeLocalIso(dateKey: string, time: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute).toISOString();
}

export function CalendarScreen({ householdId }: { householdId: string }) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [modalVisible, setModalVisible] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("19:00");
  const [newEndDate, setNewEndDate] = useState("");
  const [newEndTime, setNewEndTime] = useState("20:00");
  const [newLocation, setNewLocation] = useState("");
  const [endDatePickerVisible, setEndDatePickerVisible] = useState(false);

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
          dotColor: "#2563eb",
        };
      }
    }

    marked[selectedDateKey] = {
      ...(marked[selectedDateKey] ?? {}),
      selected: true,
      selectedColor: "#2563eb",
    };

    return marked;
  }, [events, selectedDateKey]);

  function handleMonthChange(month: DateData) {
    setVisibleMonth(new Date(month.year, month.month - 1, 1));
  }

  function handleDayPress(day: DateData) {
    setSelectedDateKey(day.dateString);
  }

  function addDays(dateKey: string, days: number) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return toDateKey(date);
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

  function getDateKeysBetween(startDateKey: string, endDateKey: string) {
    const keys: string[] = [];

    let current = startDateKey;

    while (current <= endDateKey) {
      keys.push(current);
      current = addDays(current, 1);
    }

    return keys;
  }

  function getEventEndDateKey(event: CalendarEvent) {
    if (!event.end) {
      return getEventDateKey(event);
    }

    return event.end.slice(0, 10);
  }

  function eventTouchesDate(event: CalendarEvent, dateKey: string) {
    const startKey = getEventDateKey(event);
    const endKey = getEventEndDateKey(event);

    return dateKey >= startKey && dateKey <= endKey;
  }

  function getEventDateRangeLabel(event: CalendarEvent) {
    const startKey = getEventDateKey(event);
    const endKey = getEventEndDateKey(event);

    if (startKey === endKey) {
      return `${startKey}, ${getEventTimeLabel(event)}`;
    }

    const startTime = getEventTimeLabel(event);
    const endTime = event.end
      ? new Date(event.end).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return `${startKey} ${startTime} – ${endKey}${endTime ? ` ${endTime}` : ""}`;
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

    const endDateKey = newEndDate.trim() || selectedDateKey;

    if (!/^\d\d:\d\d$/.test(newEndTime)) {
      alert("Bitte End-Uhrzeit im Format HH:MM eingeben.");
      return;
    }

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
      setModalVisible(false);
    } catch (error: any) {
      console.log("CALENDAR ADD ERROR:", error);
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
      console.log("RESPONSE:", error?.response);
      alert(JSON.stringify(error?.response, null, 2));
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "white", padding: 16, gap: 12 }}>
      <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>Kalender</Text>

      <Calendar firstDay={1} markedDates={markedDates} onDayPress={handleDayPress} onMonthChange={handleMonthChange} enableSwipeMonths />

      <Text style={{ color: "black", fontSize: 18, fontWeight: "bold" }}>Termine am {selectedDateKey}</Text>

      <ScrollView>
        {selectedEvents.length === 0 && <Text style={{ color: "#777" }}>Keine Termine an diesem Tag.</Text>}

        {selectedEvents.map((event) => (
          <View
            key={event.id}
            style={{
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#ddd",
            }}
          >
            <Text style={{ color: "black", fontSize: 16 }}>
              {getEventDateRangeLabel(event)} — {event.title}
            </Text>

            {!!event.location && <Text style={{ color: "#666" }}>{event.location}</Text>}

            <Button title="Löschen" onPress={() => removeEvent(event)} />
          </View>
        ))}
      </ScrollView>

      <Button
        title={`Termin am ${selectedDateKey} hinzufügen`}
        onPress={() => {
          setNewTitle("");
          setNewTime("19:00");
          setNewEndDate("");
          setNewEndTime("20:00");
          setNewLocation("");
          setModalVisible(true);
        }}
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 20,
              gap: 12,
            }}
          >
            <Text style={{ color: "black", fontSize: 22, fontWeight: "bold" }}>Neuer Termin am {selectedDateKey}</Text>

            <TextInput
              placeholder="Titel"
              placeholderTextColor="#666"
              value={newTitle}
              onChangeText={setNewTitle}
              style={{
                borderWidth: 1,
                borderColor: "#999",
                color: "black",
                backgroundColor: "white",
                padding: 8,
              }}
            />

            <TextInput
              placeholder="Uhrzeit, z.B. 19:00"
              placeholderTextColor="#666"
              value={newTime}
              onChangeText={setNewTime}
              style={{
                borderWidth: 1,
                borderColor: "#999",
                color: "black",
                backgroundColor: "white",
                padding: 8,
              }}
            />

            <TextInput
              placeholder="Ort optional"
              placeholderTextColor="#666"
              value={newLocation}
              onChangeText={setNewLocation}
              style={{
                borderWidth: 1,
                borderColor: "#999",
                color: "black",
                backgroundColor: "white",
                padding: 8,
              }}
            />

            <View style={{ gap: 6 }}>
              <Text style={{ color: "black", fontWeight: "bold" }}>Enddatum</Text>

              <Text style={{ color: "black" }}>{newEndDate ? formatDateKeyGerman(newEndDate) : `Gleicher Tag (${formatDateKeyGerman(selectedDateKey)})`}</Text>

              <Button title="Enddatum auswählen" onPress={() => setEndDatePickerVisible(true)} />

              {newEndDate !== "" && <Button title="Enddatum zurücksetzen" onPress={() => setNewEndDate("")} />}
            </View>

            <TextInput
              placeholder="End-Uhrzeit, z.B. 20:00"
              placeholderTextColor="#666"
              value={newEndTime}
              onChangeText={setNewEndTime}
              style={{
                borderWidth: 1,
                borderColor: "#999",
                color: "black",
                backgroundColor: "white",
                padding: 8,
              }}
            />
            <Button title="Speichern" onPress={addEvent} />
            <Button title="Schließen" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
      <Modal visible={endDatePickerVisible} transparent animationType="slide" onRequestClose={() => setEndDatePickerVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 20,
              gap: 12,
            }}
          >
            <Text style={{ color: "black", fontSize: 22, fontWeight: "bold" }}>Enddatum auswählen</Text>

            <Calendar
              firstDay={1}
              current={newEndDate || selectedDateKey}
              minDate={selectedDateKey}
              markedDates={{
                [selectedDateKey]: {
                  marked: true,
                  dotColor: "#2563eb",
                },
                [newEndDate || selectedDateKey]: {
                  selected: true,
                  selectedColor: "#2563eb",
                },
              }}
              onDayPress={(day) => {
                setNewEndDate(day.dateString === selectedDateKey ? "" : day.dateString);
                setEndDatePickerVisible(false);
              }}
              theme={{
                calendarBackground: "white",
                textSectionTitleColor: "black",
                dayTextColor: "black",
                monthTextColor: "black",
                arrowColor: "#2563eb",
                todayTextColor: "#2563eb",
                selectedDayBackgroundColor: "#2563eb",
              }}
            />

            <Button
              title="Gleicher Tag"
              onPress={() => {
                setNewEndDate("");
                setEndDatePickerVisible(false);
              }}
            />

            <Button title="Abbrechen" onPress={() => setEndDatePickerVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
