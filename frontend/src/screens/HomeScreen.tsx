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
import { brand } from "@/src/theme/brand";
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
  const heroSurface = theme.dark
    ? theme.colors.surfaceVariant
    : theme.colors.primaryContainer;
  const heroBorder = theme.colors.outline;
  const heroAccent = theme.colors.primary;
  const heroTitleColor = theme.colors.onSurface;
  const heroBodyColor = theme.colors.onSurfaceVariant;
  const heroMetaColor = theme.colors.onSurfaceVariant;
  const supportCardBackground = theme.colors.surface;
  const supportCardBorder = theme.colors.outline;
  const actionPrimary = theme.colors.primary;
  const actionPrimaryText = theme.colors.onPrimary;
  const actionSecondaryBackground = theme.colors.secondaryContainer;
  const actionSecondaryText = theme.colors.onSecondaryContainer;

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
            {
              backgroundColor: heroSurface,
              borderColor: heroBorder,
            },
          ]}
        >
          <Card.Content style={styles.heroContent}>
            <View style={styles.heroCopy}>
              <Text
                variant="labelMedium"
                style={[styles.heroEyebrow, { color: heroAccent }]}
              >
                {t("home.welcome")}
              </Text>
              <Text
                variant="headlineLarge"
                style={[styles.heroTitle, { color: heroTitleColor }]}
              >
                {displayName}
              </Text>
              <Text
                variant="bodyLarge"
                style={[styles.heroBody, { color: heroBodyColor }]}
              >
                {t("home.heroBody")}
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.heroMeta, { color: heroMetaColor }]}
              >
                {t("home.householdLabel", { name: householdName })}
              </Text>
            </View>

            <View style={styles.heroActions}>
              <Text
                variant="titleSmall"
                style={[styles.heroActionsTitle, { color: heroTitleColor }]}
              >
                {t("home.quickActionsTitle")}
              </Text>
              <View style={layout.inlineActions}>
                <Button
                  mode="contained"
                  buttonColor={actionPrimary}
                  textColor={actionPrimaryText}
                  icon="receipt-text-plus-outline"
                  contentStyle={styles.actionContent}
                  style={styles.primaryAction}
                  labelStyle={styles.actionLabel}
                  onPress={() => navigation.navigate("expenses")}
                >
                  {t("home.addExpense")}
                </Button>
                <Button
                  mode="contained-tonal"
                  buttonColor={actionSecondaryBackground}
                  textColor={actionSecondaryText}
                  icon="poll"
                  contentStyle={styles.actionContent}
                  style={styles.secondaryAction}
                  labelStyle={styles.actionLabel}
                  onPress={() => navigation.navigate("polls")}
                >
                  {t("home.createPoll")}
                </Button>
                <Button
                  mode="contained-tonal"
                  buttonColor={actionSecondaryBackground}
                  textColor={actionSecondaryText}
                  icon="calendar-plus"
                  contentStyle={styles.actionContent}
                  style={styles.secondaryAction}
                  labelStyle={styles.actionLabel}
                  onPress={() => navigation.navigate("calendar")}
                >
                  {t("home.addEvent")}
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={[styles.dashboardBody, isWide && styles.dashboardBodyWide]}>
          <Card
            style={[
              layout.card,
              styles.feedCard,
              {
                backgroundColor: supportCardBackground,
                borderColor: supportCardBorder,
              },
            ]}
          >
            <Card.Title
              title={t("home.activityTitle")}
              subtitle={t("home.activitySubtitle")}
              titleStyle={{ color: theme.colors.onSurface }}
              subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
              style={styles.cardTitle}
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
            <Card
              style={[
                layout.card,
                styles.supportCard,
                {
                  backgroundColor: supportCardBackground,
                  borderColor: supportCardBorder,
                },
              ]}
            >
              <Card.Title
                title={t("home.upcomingEventsTitle")}
                titleStyle={{
                  color: theme.colors.onSurface,
                  fontWeight: "700",
                }}
                style={styles.cardTitle}
              />
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

            <Card
              style={[
                layout.card,
                styles.supportCard,
                {
                  backgroundColor: supportCardBackground,
                  borderColor: supportCardBorder,
                },
              ]}
            >
              <Card.Title
                title={t("home.openPollsTitle")}
                titleStyle={{
                  color: theme.colors.onSurface,
                  fontWeight: "700",
                }}
                style={styles.cardTitle}
              />
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

            <Card
              style={[
                layout.card,
                styles.supportCard,
                {
                  backgroundColor: supportCardBackground,
                  borderColor: supportCardBorder,
                },
              ]}
            >
              <Card.Title
                title={t("home.yourReminderTitle")}
                titleStyle={{
                  color: theme.colors.onSurface,
                  fontWeight: "700",
                }}
                style={styles.cardTitle}
              />
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
    borderWidth: 1,
    borderRadius: brand.radius.hero,
  },
  heroContent: {
    gap: brand.spacing.section + 4,
    paddingVertical: brand.spacing.cluster,
  },
  heroCopy: {
    gap: 8,
  },
  heroActions: {
    gap: brand.spacing.cluster + 2,
  },
  heroEyebrow: {
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  heroTitle: {
    fontWeight: "700",
  },
  heroBody: {
    lineHeight: 24,
    maxWidth: 720,
  },
  heroMeta: {
    fontWeight: "500",
  },
  heroActionsTitle: {
    fontWeight: "700",
  },
  actionContent: {
    minHeight: 46,
    paddingHorizontal: 4,
  },
  actionLabel: {
    letterSpacing: 0.2,
    fontWeight: "700",
  },
  primaryAction: {
    borderRadius: brand.radius.control,
  },
  secondaryAction: {
    borderRadius: brand.radius.control,
  },
  dashboardBody: {
    gap: brand.spacing.section,
  },
  dashboardBodyWide: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  feedCard: {
    flex: 1.7,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: brand.radius.card + 4,
  },
  supportColumn: {
    flex: 1,
    minWidth: 280,
    gap: brand.spacing.section,
  },
  supportCard: {
    borderWidth: 1,
    borderRadius: brand.radius.card + 2,
  },
  cardTitle: {
    paddingBottom: 2,
  },
  stateText: {
    paddingHorizontal: brand.spacing.card,
    paddingBottom: brand.spacing.section,
  },
  stateWithAction: {
    gap: 10,
    paddingHorizontal: brand.spacing.card,
    paddingBottom: 12,
  },
  reminderCardContent: {
    gap: 10,
  },
  supportingText: {
    opacity: 0.78,
  },
});
