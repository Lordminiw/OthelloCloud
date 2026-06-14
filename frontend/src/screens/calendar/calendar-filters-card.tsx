import { Card } from "react-native-paper";
import { layout } from "@/components/app-screen";
import { CalendarDisplayDropdown } from "@/components/calendar-display-dropdown";
import type { CalendarScreenViewModel } from "./use-calendar-screen";

export function CalendarFiltersCard({ vm }: { vm: CalendarScreenViewModel }) {
  return (
    <Card style={layout.card}>
      <Card.Title title={vm.isGerman ? "Kalenderfilter" : "Calendar filters"} />
      <Card.Content>
        <CalendarDisplayDropdown
          subscriptions={vm.calendarSubscriptions}
          selectedHouseholdIds={vm.selectedHouseholdIds}
          selectedSubscriptionIds={vm.selectedSubscriptionIds}
          onToggleHousehold={vm.toggleSelectedHousehold}
          onToggleSubscription={vm.toggleSelectedSubscription}
        />
      </Card.Content>
    </Card>
  );
}
