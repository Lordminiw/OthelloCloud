import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Household } from "../lib/household";
import { CalendarScreen } from "./CalendarScreen";
import { ExpensesScreen } from "./ExpensesScreen";
import { ProfileScreen } from "./ProfileScreen";
import { ShoppingListScreen } from "./ShoppingListScreen";

const Tab = createBottomTabNavigator();

export function MainTabs({
  household,
  onLogout,
}: {
  household: Household;
  onLogout: () => void;
}) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Einkauf">
        {() => <ShoppingListScreen householdId={household.id} />}
      </Tab.Screen>

      <Tab.Screen name="Ausgaben">
        {() => <ExpensesScreen householdId={household.id} />}
      </Tab.Screen>

      <Tab.Screen name="Kalender">
        {() => <CalendarScreen householdId={household.id} />}
      </Tab.Screen>

      <Tab.Screen name="Profil">
        {() => <ProfileScreen household={household} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}