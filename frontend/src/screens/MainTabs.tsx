import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/constants/theme";
import { CalendarScreen } from "./CalendarScreen";
import { ExpensesScreen } from "./ExpensesScreen";
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
  const theme = useAppTheme();
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
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 12,
          height: 74 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 10 + insets.bottom,
          paddingHorizontal: 8,
          borderTopWidth: 0,
          borderRadius: 24,
          backgroundColor: theme.brand.palette.panel,
          shadowColor: theme.brand.shadowColor,
          shadowOpacity: 0.24,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          borderRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          lineHeight: 12,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          marginTop: 3,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarBackground: () => (
          <IconFrame
            borderColor={theme.brand.palette.chromeStrong}
            fill={theme.brand.palette.panel}
          />
        ),
        tabBarActiveBackgroundColor: theme.brand.palette.accentSoft,
      }}
    >
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
  return <Icon source={icon} color={color} size={Math.min(size, 22)} />;
}

function IconFrame({
  borderColor,
  fill,
}: {
  borderColor: string;
  fill: string;
}) {
  return (
    <>
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.tabShell,
          { backgroundColor: fill, borderColor },
        ]}
      />
      <View style={[styles.tabRule, { backgroundColor: borderColor }]} />
    </>
  );
}

const styles = StyleSheet.create({
  tabShell: {
    borderWidth: 1,
    borderRadius: 24,
  },
  tabRule: {
    position: "absolute",
    left: 18,
    right: 18,
    top: 10,
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
});
