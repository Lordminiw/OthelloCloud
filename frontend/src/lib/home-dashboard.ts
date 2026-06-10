import type { CalendarEvent } from "./calendar";
import { loadUpcomingCalendarEvents } from "./calendar";
import type { Expense } from "./expenses";
import { loadRecentExpenses } from "./expenses";
import { loadActivePolls, type ParsedPoll } from "./polls";

export type DashboardActivityItem =
  | {
      id: string;
      type: "expense";
      title: string;
      detail: string;
      timestamp: string;
      tab: "expenses";
    }
  | {
      id: string;
      type: "event";
      title: string;
      detail: string;
      timestamp: string;
      tab: "calendar";
    }
  | {
      id: string;
      type: "poll";
      title: string;
      detail: string;
      timestamp: string;
      tab: "polls";
    };

export type DashboardReminder =
  | { kind: "vote-pending"; title: string; targetTab: "polls" }
  | { kind: "all-caught-up"; title: string; targetTab?: undefined };

export type DashboardData = {
  activity: DashboardActivityItem[];
  upcomingEvents: CalendarEvent[];
  openPolls: ParsedPoll[];
  recentExpenses: Expense[];
  reminder: DashboardReminder;
};

export type DashboardSectionErrors = {
  recentExpenses: boolean;
  upcomingEvents: boolean;
  openPolls: boolean;
};

export async function loadHomeDashboardData(
  householdId: string,
  userId: string
): Promise<{
  data: DashboardData;
  errors: DashboardSectionErrors;
}> {
  const [expensesResult, eventsResult, pollsResult] = await Promise.allSettled([
    loadRecentExpenses(householdId, 4),
    loadUpcomingCalendarEvents({ householdId, limit: 4 }),
    loadActivePolls(householdId, 4),
  ]);

  const recentExpenses =
    expensesResult.status === "fulfilled" ? expensesResult.value : [];
  const upcomingEvents =
    eventsResult.status === "fulfilled" ? eventsResult.value : [];
  const openPolls = pollsResult.status === "fulfilled" ? pollsResult.value : [];

  return {
    data: {
      recentExpenses,
      upcomingEvents,
      openPolls,
      activity: buildDashboardActivity({
        expenses: recentExpenses,
        events: upcomingEvents,
        polls: openPolls,
      }),
      reminder: buildDashboardReminder(openPolls, userId),
    },
    errors: {
      recentExpenses: expensesResult.status === "rejected",
      upcomingEvents: eventsResult.status === "rejected",
      openPolls: pollsResult.status === "rejected",
    },
  };
}

export function buildDashboardActivity(input: {
  expenses: Expense[];
  events: CalendarEvent[];
  polls: ParsedPoll[];
}): DashboardActivityItem[] {
  return [
    ...input.expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      type: "expense" as const,
      title: expense.description,
      detail: `${expense.amount.toFixed(2)} paid`,
      timestamp: expense.created || expense.id,
      tab: "expenses" as const,
    })),
    ...input.events.map((event) => ({
      id: `event-${event.id}`,
      type: "event" as const,
      title: event.title,
      detail: event.location || "",
      timestamp: event.start,
      tab: "calendar" as const,
    })),
    ...input.polls.map((poll) => ({
      id: `poll-${poll.id}`,
      type: "poll" as const,
      title: poll.question,
      detail: `${poll.options.length} options`,
      timestamp: poll.created || "",
      tab: "polls" as const,
    })),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function buildDashboardReminder(
  polls: ParsedPoll[],
  userId: string
): DashboardReminder {
  const unanswered = polls.find((poll) => !(poll.votes[userId] ?? []).length);

  if (unanswered) {
    return {
      kind: "vote-pending",
      title: unanswered.question,
      targetTab: "polls",
    };
  }

  return { kind: "all-caught-up", title: "You're all caught up." };
}
