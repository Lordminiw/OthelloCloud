import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CalendarScreen } from "./CalendarScreen";
import { ExpensesScreen } from "./ExpensesScreen";
import { ProfileScreen } from "./ProfileScreen";
import { ShoppingListScreen } from "./ShoppingListScreen";

const Tab = createBottomTabNavigator();

export function MainTabs({
  householdId,
  onLogout,
}: {
  householdId: string;
  onLogout: () => void;
}) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Einkauf">
        {() => <ShoppingListScreen householdId={householdId} />}
      </Tab.Screen>

      <Tab.Screen name="Ausgaben">
        {() => <ExpensesScreen householdId={householdId} />}
      </Tab.Screen>

      <Tab.Screen name="Kalender">
        {() => <CalendarScreen householdId={householdId} />}
      </Tab.Screen>

      <Tab.Screen name="Profil">
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}