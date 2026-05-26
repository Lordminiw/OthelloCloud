import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon, useTheme } from "react-native-paper";
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
  const theme = useTheme();
  const { activeHousehold } = useHousehold();

  if (!activeHousehold) {
    return null;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Einkauf"
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} icon="cart-outline" />
          ),
        }}
      >
        {() => <ShoppingListScreen householdId={activeHousehold.id} />}
      </Tab.Screen>

      <Tab.Screen
        name="Ausgaben"
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} icon="receipt-outline" />
          ),
        }}
      >
        {() => <ExpensesScreen householdId={activeHousehold.id} />}
      </Tab.Screen>

      <Tab.Screen
        name="Kalender"
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} icon="calendar-month-outline" />
          ),
        }}
      >
        {() => <CalendarScreen householdId={activeHousehold.id} />}
      </Tab.Screen>

      <Tab.Screen
        name="Profil"
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} icon="account-circle-outline" />
          ),
        }}
      >
        {() => <ProfileScreen household={activeHousehold} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function TabIcon({
  color,
  size,
  icon,
}: {
  color: string;
  size: number;
  icon: string;
}) {
  return <Icon source={icon} color={color} size={size} />;
}
