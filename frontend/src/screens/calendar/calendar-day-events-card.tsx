import { ScrollView, StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";
import { layout } from "@/components/app-screen";
import type { CalendarScreenViewModel } from "./use-calendar-screen";

export function CalendarDayEventsCard({ vm }: { vm: CalendarScreenViewModel }) {
  const totalEvents = vm.selectedEvents.length + vm.upcomingEvents.length;

  return (
    <Card style={layout.card}>
      <Card.Title
        title={vm.isGerman ? "Anstehende Termine" : "Upcoming events"}
        subtitle={
          totalEvents > 0
            ? `${totalEvents} ${vm.isGerman ? "anstehende Termine" : "upcoming events"}`
            : vm.isGerman
              ? "Keine weiteren Termine"
              : "No further events"
        }
      />
      <Card.Content style={layout.listCardContent}>
        {totalEvents === 0 && (
          <Text variant="bodyMedium" style={styles.emptyText}>
            {vm.isGerman
              ? "Es stehen noch keine weiteren Termine an."
              : "There are no further events yet."}
          </Text>
        )}

        {totalEvents > 0 && (
          <ScrollView nestedScrollEnabled style={!vm.isWide && styles.mobileCardList}>
            {vm.selectedEventViews}
            {vm.upcomingEventViews}
          </ScrollView>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    paddingHorizontal: 16,
  },
  mobileCardList: {
    maxHeight: 360,
  },
});
