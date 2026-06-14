import { StyleSheet, View } from "react-native";
import { AppScreen, layout } from "@/components/app-screen";
import { PageSection, SplitLayout } from "@/components/layout";
import { CalendarDayEventsCard } from "./calendar/calendar-day-events-card";
import { CalendarEventDialog } from "./calendar/calendar-event-dialog";
import { CalendarFiltersCard } from "./calendar/calendar-filters-card";
import { CalendarOverviewCard } from "./calendar/calendar-overview-card";
import { useCalendarScreen } from "./calendar/use-calendar-screen";

export function CalendarScreen({ householdId }: { householdId: string }) {
  const vm = useCalendarScreen(householdId);

  return (
    <AppScreen
      title={vm.isGerman ? "Kalender" : "Calendar"}
      browserTitle={vm.isGerman ? "Othello-Cloud | Kalender" : "Othello-Cloud | Calendar"}
    >
      <PageSection>
        <SplitLayout style={!vm.isWide && styles.narrowLayout}>
          <View style={[layout.stack, vm.isWide && layout.wideForm]}>
            <CalendarOverviewCard vm={vm} />
          </View>
          <View style={[layout.stack, vm.isWide && layout.widePanel]}>
            <CalendarFiltersCard vm={vm} />
            <CalendarDayEventsCard vm={vm} />
          </View>
        </SplitLayout>
      </PageSection>
      <CalendarEventDialog vm={vm} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  narrowLayout: {
    flexDirection: "column",
    flexWrap: "nowrap",
  },
});
