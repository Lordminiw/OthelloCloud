import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Menu } from "react-native-paper";
import { useAppTheme } from "@/constants/theme";
import { getHeaderControlStyles } from "@/components/header-control-styles";
import { useHousehold } from "@/context/household-context";
import { useLanguage } from "@/context/language-context";
import { CalendarSubscription } from "@/src/lib/calendar-subscriptions";

export function CalendarDisplayDropdown({
  subscriptions,
  selectedHouseholdIds,
  selectedSubscriptionIds,
  onToggleHousehold,
  onToggleSubscription,
}: {
  subscriptions: CalendarSubscription[];
  selectedHouseholdIds: string[];
  selectedSubscriptionIds: string[];
  onToggleHousehold: (householdId: string) => void;
  onToggleSubscription: (subscriptionId: string) => void;
}) {
  const theme = useAppTheme();
  const headerControlStyles = getHeaderControlStyles(theme);
  const { households } = useHousehold();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const selectedCount =
    selectedHouseholdIds.length + selectedSubscriptionIds.length;

  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setVisible(true)}
            icon="calendar-multiple"
            style={[headerControlStyles.button, styles.button]}
            contentStyle={headerControlStyles.content}
            labelStyle={[headerControlStyles.label, { color: theme.brand.palette.text }]}
            textColor={theme.brand.palette.text}
            compact
          >
            {t("calendar.selectedCalendars", { count: selectedCount })}
          </Button>
        }
      >
        <Menu.Item title={t("calendar.householdCalendars")} disabled />
        {households.map((household) => {
          const selected = selectedHouseholdIds.includes(household.id);
          return (
            <Menu.Item
              key={household.id}
              title={household.name}
              leadingIcon={selected ? "check" : "home"}
              onPress={() => onToggleHousehold(household.id)}
            />
          );
        })}

        {subscriptions.length > 0 && (
          <Menu.Item title={t("calendar.importedCalendars")} disabled />
        )}
        {subscriptions.map((subscription) => {
          const selected = selectedSubscriptionIds.includes(subscription.id);
          return (
            <Menu.Item
              key={subscription.id}
              title={subscription.name}
              leadingIcon={selected ? "check" : "calendar-import"}
              onPress={() => onToggleSubscription(subscription.id)}
            />
          );
        })}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  button: {
    maxWidth: 220,
  },
});
