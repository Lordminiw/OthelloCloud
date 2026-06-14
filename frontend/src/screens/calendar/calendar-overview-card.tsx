import { StyleSheet, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { Button, Card } from "react-native-paper";
import { layout } from "@/components/app-screen";
import type { CalendarScreenViewModel } from "./use-calendar-screen";

export function CalendarOverviewCard({ vm }: { vm: CalendarScreenViewModel }) {
  return (
    <Card style={layout.card}>
      <Card.Title title={vm.isGerman ? "Monatsansicht" : "Month view"} />
      <Card.Content>
        <View style={styles.calendarActions}>
          <Button mode="outlined" onPress={vm.openCreateDialog}>
            {vm.isGerman ? "Termin hinzufuegen" : "Add event"}
          </Button>
          <Button mode="outlined" onPress={() => vm.setColorConfigVisible(true)}>
            {vm.isGerman ? "Farben" : "Colors"}
          </Button>
        </View>

        <Calendar
          key={`${vm.theme.dark ? "dark" : "light"}-${vm.language}`}
          firstDay={1}
          markedDates={vm.markedDates}
          onDayPress={vm.handleDayPress}
          onMonthChange={vm.handleMonthChange}
          enableSwipeMonths
          markingType="multi-period"
          theme={vm.calendarTheme}
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  calendarActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
});
