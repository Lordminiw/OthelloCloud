import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Button,
  Card,
  Divider,
  List,
  Text,
  useTheme,
} from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
import { HouseholdDropdown } from "@/components/household-dropdown";
import { useHousehold } from "@/context/household-context";
import { useLanguage } from "@/context/language-context";
import {
  type DashboardActivityItem,
  type DashboardData,
  type DashboardReminder,
  type DashboardSectionErrors,
  loadHomeDashboardData,
} from "@/src/lib/home-dashboard";
import { pb } from "../lib/pocketbase";

type HomeScreenProps = {
  householdId: string;
};

const EMPTY_DASHBOARD: DashboardData = {
  activity: [],
  upcomingEvents: [],
  openPolls: [],
  recentExpenses: [],
  reminder: { kind: "all-caught-up" },
};

const EMPTY_SECTION_ERRORS: DashboardSectionErrors = {
  recentExpenses: false,
  upcomingEvents: false,
  openPolls: false,
};

export function HomeScreen({ householdId }: HomeScreenProps) {
  const { t, language } = useLanguage();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { households } = useHousehold();
  const householdName =
    households.find((household) => household.id === householdId)?.name ??
    t("home.title");
  const currentUserId = pb.authStore.model?.id ?? "";
  const displayName =
    String(pb.authStore.model?.name ?? "").trim() ||
    String(pb.authStore.model?.email ?? "").trim() ||
    householdName;
  const locale = language === "de" ? "de-DE" : "en-US";

  const [dashboard, setDashboard] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [sectionErrors, setSectionErrors] =
    useState<DashboardSectionErrors>(EMPTY_SECTION_ERRORS);
  const [loading, setLoading] = useState(true);
  const [globalUnavailable, setGlobalUnavailable] = useState(false);
  const hasHandledInitialFocusRef = useRef(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setGlobalUnavailable(false);

    try {
      const result = await loadHomeDashboardData(householdId, currentUserId);
      setDashboard(result.data);
      setSectionErrors(result.errors);
    } catch {
      setDashboard(EMPTY_DASHBOARD);
      setSectionErrors({
        recentExpenses: true,
        upcomingEvents: true,
        openPolls: true,
      });
      setGlobalUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, householdId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    return navigation.addListener("focus", () => {
      if (!hasHandledInitialFocusRef.current) {
        hasHandledInitialFocusRef.current = true;
        return;
      }

      void loadDashboard();
    });
  }, [loadDashboard, navigation]);

  const activityUnavailable =
    globalUnavailable ||
    (dashboard.activity.length === 0 &&
      (sectionErrors.recentExpenses ||
        sectionErrors.upcomingEvents ||
        sectionErrors.openPolls));

  return (
    <AppScreen
      title={t("home.title")}
      right={<HouseholdDropdown />}
      browserTitle={t("home.browserTitle")}
    >
      <View style={layout.stack}>
        <Card
          style={[
            layout.card,
            styles.heroCard,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Card.Content style={styles.heroContent}>
            <View style={styles.heroCopy}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                {t("home.welcome")}
              </Text>
              <Text
                variant="headlineSmall"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                {displayName}
              </Text>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                {t("home.heroBody")}
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                {t("home.householdLabel", { name: householdName })}
              </Text>
            </View>

            <View style={styles.heroActions}>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                {t("home.quickActionsTitle")}
              </Text>
              <View style={layout.inlineActions}>
                <Button
                  mode="contained"
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                  icon="receipt-text-plus-outline"
                  onPress={() => navigation.navigate("expenses")}
                >
                  {t("home.addExpense")}
                </Button>
                <Button
                  mode="contained-tonal"
                  icon="poll"
                  onPress={() => navigation.navigate("polls")}
                >
                  {t("home.createPoll")}
                </Button>
                <Button
                  mode="contained-tonal"
                  icon="calendar-plus"
                  onPress={() => navigation.navigate("calendar")}
                >
                  {t("home.addEvent")}
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={[styles.dashboardBody, isWide && styles.dashboardBodyWide]}>
          <Card style={[layout.card, styles.feedCard]}>
            <Card.Title
              title={t("home.activityTitle")}
              subtitle={t("home.activitySubtitle")}
            />
            <Card.Content style={layout.listCardContent}>
              {renderActivityState({
                activity: dashboard.activity,
                loading,
                unavailable: activityUnavailable,
                locale,
                navigation,
                t,
              })}
            </Card.Content>
          </Card>

          <View style={styles.supportColumn}>
            <Card style={layout.card}>
              <Card.Title title={t("home.upcomingEventsTitle")} />
              <Card.Content style={layout.listCardContent}>
                {renderEventsState({
                  events: dashboard.upcomingEvents,
                  loading,
                  unavailable: globalUnavailable || sectionErrors.upcomingEvents,
                  locale,
                  navigation,
                  t,
                })}
              </Card.Content>
            </Card>

            <Card style={layout.card}>
              <Card.Title title={t("home.openPollsTitle")} />
              <Card.Content style={layout.listCardContent}>
                {renderPollsState({
                  polls: dashboard.openPolls,
                  loading,
                  unavailable: globalUnavailable || sectionErrors.openPolls,
                  locale,
                  navigation,
                  t,
                })}
              </Card.Content>
            </Card>

            <Card style={layout.card}>
              <Card.Title title={t("home.yourReminderTitle")} />
              <Card.Content style={styles.reminderCardContent}>
                {renderReminderState({
                  reminder: dashboard.reminder,
                  loading,
                  unavailable: globalUnavailable || sectionErrors.openPolls,
                  navigation,
                  t,
                })}
              </Card.Content>
            </Card>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

function renderActivityState(input: {
  activity: DashboardActivityItem[];
  loading: boolean;
  unavailable: boolean;
  locale: string;
  navigation: any;
  t: (key: string, args?: Record<string, string | number | boolean>) => string;
}) {
  if (input.loading) {
    return <StateText>{input.t("common.loading")}</StateText>;
  }

  if (input.unavailable) {
    return <StateText>{input.t("home.activityUnavailable")}</StateText>;
  }

  if (input.activity.length === 0) {
    return <StateText>{input.t("home.activityEmpty")}</StateText>;
  }

  return (
    <View>
      {input.activity.map((item, index) => (
        <View key={item.id}>
          <List.Item
            title={item.title}
            description={getActivityDescription(item, input.locale, input.t)}
            left={(props) => (
              <List.Icon {...props} icon={getActivityIcon(item.type)} />
            )}
            right={(props) => (
              <List.Icon
                {...props}
                icon="chevron-right"
                color={props.color}
              />
            )}
            onPress={() => input.navigation.navigate(item.tab)}
          />
          {index < input.activity.length - 1 ? <Divider /> : null}
        </View>
      ))}
    </View>
  );
}

function renderEventsState(input: {
  events: DashboardData["upcomingEvents"];
  loading: boolean;
  unavailable: boolean;
  locale: string;
  navigation: any;
  t: (key: string, args?: Record<string, string | number | boolean>) => string;
}) {
  if (input.loading) {
    return <StateText>{input.t("common.loading")}</StateText>;
  }

  if (input.unavailable) {
    return <StateText>{input.t("home.upcomingEventsUnavailable")}</StateText>;
  }

  if (input.events.length === 0) {
    return (
      <View style={styles.stateWithAction}>
        <StateText padded={false}>{input.t("home.upcomingEventsEmpty")}</StateText>
        <Button onPress={() => input.navigation.navigate("calendar")}>
          {input.t("home.viewCalendar")}
        </Button>
      </View>
    );
  }

  return (
    <View>
      {input.events.map((event, index) => (
        <View key={event.id}>
          <List.Item
            title={event.title}
            description={formatEventMeta(event.start, event.location, input.locale, input.t)}
            left={(props) => <List.Icon {...props} icon="calendar-clock-outline" />}
            onPress={() => input.navigation.navigate("calendar")}
          />
          {index < input.events.length - 1 ? <Divider /> : null}
        </View>
      ))}
    </View>
  );
}

function renderPollsState(input: {
  polls: DashboardData["openPolls"];
  loading: boolean;
  unavailable: boolean;
  locale: string;
  navigation: any;
  t: (key: string, args?: Record<string, string | number | boolean>) => string;
}) {
  if (input.loading) {
    return <StateText>{input.t("common.loading")}</StateText>;
  }

  if (input.unavailable) {
    return <StateText>{input.t("home.openPollsUnavailable")}</StateText>;
  }

  if (input.polls.length === 0) {
    return (
      <View style={styles.stateWithAction}>
        <StateText padded={false}>{input.t("home.openPollsEmpty")}</StateText>
        <Button onPress={() => input.navigation.navigate("polls")}>
          {input.t("home.viewPolls")}
        </Button>
      </View>
    );
  }

  return (
    <View>
      {input.polls.map((poll, index) => (
        <View key={poll.id}>
          <List.Item
            title={poll.question}
            description={input.t("home.pollMeta", {
              count: poll.options.length,
            })}
            left={(props) => <List.Icon {...props} icon="poll" />}
            onPress={() => input.navigation.navigate("polls")}
          />
          {index < input.polls.length - 1 ? <Divider /> : null}
        </View>
      ))}
    </View>
  );
}

function renderReminderState(input: {
  reminder: DashboardReminder;
  loading: boolean;
  unavailable: boolean;
  navigation: any;
  t: (key: string, args?: Record<string, string | number | boolean>) => string;
}) {
  if (input.loading) {
    return <StateText>{input.t("common.loading")}</StateText>;
  }

  if (input.unavailable) {
    return <StateText padded={false}>{input.t("home.reminderUnavailable")}</StateText>;
  }

  if (input.reminder.kind === "vote-pending") {
    return (
      <View style={styles.stateWithAction}>
        <View style={layout.stack}>
          <Text variant="bodyLarge">{input.t("home.reminderVotePending")}</Text>
          <Text variant="bodyMedium" style={styles.supportingText}>
            {input.reminder.pollQuestion}
          </Text>
        </View>
        <Button onPress={() => input.navigation.navigate(input.reminder.targetTab)}>
          {input.t("home.viewPolls")}
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.stateWithAction}>
      <StateText padded={false}>{input.t("home.reminderAllCaughtUp")}</StateText>
      <Button onPress={() => input.navigation.navigate("expenses")}>
        {input.t("home.viewExpenses")}
      </Button>
    </View>
  );
}

function getActivityDescription(
  item: DashboardActivityItem,
  locale: string,
  t: (key: string, args?: Record<string, string | number | boolean>) => string
) {
  if (item.type === "expense") {
    return t("home.expenseActivity", {
      amount: formatCurrency(item.amount, locale),
    });
  }

  if (item.type === "poll") {
    return t("home.pollMeta", { count: item.optionCount });
  }

  return formatEventMeta(item.startsAt, item.location, locale, t);
}

function getActivityIcon(type: DashboardActivityItem["type"]) {
  if (type === "expense") {
    return "receipt-text-outline";
  }

  if (type === "poll") {
    return "poll";
  }

  return "calendar-clock-outline";
}

function formatCurrency(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatEventMeta(
  startsAt: string,
  location: string | undefined,
  locale: string,
  t: (key: string, args?: Record<string, string | number | boolean>) => string
) {
  const date = new Date(startsAt);
  const dateLabel = Number.isNaN(date.getTime())
    ? startsAt
    : date.toLocaleString(locale, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

  if (location?.trim()) {
    return t("home.eventMetaWithLocation", {
      date: dateLabel,
      location: location.trim(),
    });
  }

  return t("home.eventMetaWithoutLocation", {
    date: dateLabel,
  });
}

function StateText({
  children,
  padded = true,
}: {
  children: string;
  padded?: boolean;
}) {
  return (
    <Text variant="bodyMedium" style={padded ? styles.stateText : undefined}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    overflow: "hidden",
  },
  heroContent: {
    gap: 18,
  },
  heroCopy: {
    gap: 6,
  },
  heroActions: {
    gap: 10,
  },
  dashboardBody: {
    gap: 12,
  },
  dashboardBodyWide: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  feedCard: {
    flex: 1.7,
    minWidth: 0,
  },
  supportColumn: {
    flex: 1,
    minWidth: 280,
    gap: 12,
  },
  stateText: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  stateWithAction: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  reminderCardContent: {
    gap: 8,
  },
  supportingText: {
    opacity: 0.78,
  },
});
