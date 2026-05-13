import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ShoppingListScreen } from "./ShoppingListScreen";
import { ExpensesScreen } from "./ExpensesScreen";
import { CalendarScreen } from "./CalendarScreen";
import { ProfileScreen } from "./ProfileScreen";

const Tab = createBottomTabNavigator();

export function MainTabs({
  householdId,
  onLogout,
}: {
  householdId: string;
  onLogout: () => void;
}) {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Einkaufsliste">
        {() => <ShoppingListScreen householdId={householdId} />}
      </Tab.Screen>

      <Tab.Screen name="Ausgaben" component={ExpensesScreen} />

      <Tab.Screen name="Kalender" component={CalendarScreen} />

      <Tab.Screen name="Profil">
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}