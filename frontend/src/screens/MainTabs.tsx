import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CalendarScreen } from "./CalendarScreen";
import { ExpensesScreen } from "./ExpensesScreen";
import { ProfileScreen } from "./ProfileScreen";
import { ShoppingListScreen } from "./ShoppingListScreen";
import { useHousehold } from "@/context/household-context";

const Tab = createBottomTabNavigator();

export function MainTabs({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const { activeHousehold } = useHousehold();

  if (!activeHousehold) {
    return null;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Einkauf">
        {() => <ShoppingListScreen householdId={activeHousehold.id} />}
      </Tab.Screen>

      <Tab.Screen name="Ausgaben">
        {() => <ExpensesScreen householdId={activeHousehold.id} />}
      </Tab.Screen>

      <Tab.Screen name="Kalender">
        {() => <CalendarScreen householdId={activeHousehold.id} />}
      </Tab.Screen>

      <Tab.Screen name="Profil">
        {() => <ProfileScreen household={activeHousehold} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}