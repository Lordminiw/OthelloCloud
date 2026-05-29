import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarScreen } from "./CalendarScreen";
import { ExpensesScreen } from "./ExpensesScreen";
import { PollsScreen } from "./PollsScreen";
import { ProfileScreen } from "./ProfileScreen";
import { ShoppingListScreen } from "./ShoppingListScreen";
import { useHousehold } from "@/context/household-context";

const Tab = createBottomTabNavigator();

export function MainTabs({
  initialTabName,
  initialInviteCode,
  onLogout,
}: {
  initialTabName?: string;
  initialInviteCode?: string;
  onLogout: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { activeHousehold } = useHousehold();

  if (!activeHousehold) {
    return null;
  }

  return (
    <Tab.Navigator
      initialRouteName={initialTabName}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          height: 70 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 10 + insets.bottom,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          lineHeight: 12,
          marginTop: 1,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginBottom: 0,
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
        name="Umfragen"
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} icon="poll" />
          ),
        }}
      >
        {() => <PollsScreen householdId={activeHousehold.id} />}
      </Tab.Screen>

      <Tab.Screen
        name="Profil"
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} icon="account-circle-outline" />
          ),
        }}
      >
        {() => (
          <ProfileScreen
            household={activeHousehold}
            initialInviteCode={initialInviteCode}
            onLogout={onLogout}
          />
        )}
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
  return <Icon source={icon} color={color} size={Math.min(size, 22)} />;
}
