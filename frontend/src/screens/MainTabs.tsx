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
  onLogout,
}: {
  initialTabName?: string;
  initialInviteCode?: string;
  onLogout: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { activeHousehold } = useHousehold();
  const { t } = useLanguage();
  const tabBarHeight = 74 + insets.bottom;

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
        tabBarActiveBackgroundColor: theme.colors.secondaryContainer,
        tabBarStyle: {
          backgroundColor: theme.colors.elevation.level1,
          borderTopWidth: 0,
          height: tabBarHeight,
          paddingTop: 10,
          paddingBottom: 12 + insets.bottom,
          paddingHorizontal: 12,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: theme.colors.onSurface,
          shadowOpacity: 0.08,
          shadowRadius: 18,
          shadowOffset: {
            width: 0,
            height: -4,
          },
          elevation: 10,
        },
        tabBarItemStyle: {
          borderRadius: 18,
          marginHorizontal: 4,
          paddingVertical: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          lineHeight: 12,
          marginTop: 3,
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
        name="profile"
        options={{
          tabBarLabel: t("tabs.profile"),
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
  return <Icon source={icon} color={color} size={Math.min(size, 21)} />;
}
