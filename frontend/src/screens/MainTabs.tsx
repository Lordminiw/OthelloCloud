import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarScreen } from "./CalendarScreen";
import { ExpensesScreen } from "./ExpensesScreen";
import { HomeScreen } from "./HomeScreen";
import { PollsScreen } from "./PollsScreen";
import { ProfileScreen } from "./ProfileScreen";
import { ShoppingListScreen } from "./ShoppingListScreen";
import { useHousehold } from "@/context/household-context";
import { useLanguage } from "@/context/language-context";

const Tab = createBottomTabNavigator();

export function MainTabs({
  initialTabName,
  initialInviteCode,
}: {
  initialTabName?: string;
  initialInviteCode?: string;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { activeHousehold } = useHousehold();
  const { t } = useLanguage();

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
        name="home"
        options={{
          tabBarLabel: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} icon="view-dashboard-outline" />
          ),
        }}
      >
        {() => <HomeScreen householdId={activeHousehold.id} />}
      </Tab.Screen>

      <Tab.Screen
        name="shopping"
        options={{
          tabBarLabel: t("tabs.shopping"),
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} icon="cart-outline" />
          ),
        }}
      >
        {() => <ShoppingListScreen householdId={activeHousehold.id} />}
      </Tab.Screen>

      <Tab.Screen
        name="expenses"
        options={{
          tabBarLabel: t("tabs.expenses"),
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} icon="receipt-outline" />
          ),
        }}
      >
        {() => <ExpensesScreen householdId={activeHousehold.id} />}
      </Tab.Screen>

      <Tab.Screen
        name="calendar"
        options={{
          tabBarLabel: t("tabs.calendar"),
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} icon="calendar-month-outline" />
          ),
        }}
      >
        {() => <CalendarScreen householdId={activeHousehold.id} />}
      </Tab.Screen>

      <Tab.Screen
        name="polls"
        options={{
          tabBarLabel: t("tabs.polls"),
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} icon="poll" />
          ),
        }}
      >
        {() => <PollsScreen householdId={activeHousehold.id} />}
      </Tab.Screen>

      <Tab.Screen
        name="settings"
        options={{
          tabBarButton: () => null,
        }}
      >
        {() => (
          <ProfileScreen
            household={activeHousehold}
            initialInviteCode={initialInviteCode}
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
