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
      amount: number;
      createdAt?: string;
      sortAt?: string;
      tab: "expenses";
    }
  | {
      id: string;
      type: "poll";
      title: string;
      optionCount: number;
      createdAt?: string;
      sortAt?: string;
      tab: "polls";
    }
  | {
      id: string;
      type: "event";
      title: string;
      location?: string;
      startsAt: string;
      sortAt: string;
      tab: "calendar";
    };

export type DashboardReminder =
  | { kind: "vote-pending"; pollQuestion: string; targetTab: "polls" }
  | { kind: "all-caught-up"; targetTab?: undefined };

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
  const now = Date.now();

  return [
    ...input.expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      type: "expense" as const,
      title: expense.description,
      amount: expense.amount,
      createdAt: expense.created,
      sortAt: expense.created,
      tab: "expenses" as const,
    })),
    ...input.polls.map((poll) => ({
      id: `poll-${poll.id}`,
      type: "poll" as const,
      title: poll.question,
      optionCount: poll.options.length,
      createdAt: poll.created,
      sortAt: poll.created,
      tab: "polls" as const,
    })),
    ...input.events.map((event) => ({
      id: `event-${event.id}`,
      type: "event" as const,
      title: event.title,
      location: event.location || undefined,
      startsAt: event.start,
      sortAt: event.start,
      tab: "calendar" as const,
    })),
  ].sort((a, b) => compareDashboardActivityItems(a, b, now));
}

export function buildDashboardReminder(
  polls: ParsedPoll[],
  userId: string
): DashboardReminder {
  const unanswered = polls.find((poll) => !(poll.votes[userId] ?? []).length);

  if (unanswered) {
    return {
      kind: "vote-pending",
      pollQuestion: unanswered.question,
      targetTab: "polls",
    };
  }

  return { kind: "all-caught-up" };
}

function compareDashboardActivityItems(
  a: DashboardActivityItem,
  b: DashboardActivityItem,
  now: number
) {
  // Mixed feed rule: rank items by temporal closeness to now so recent
  // activity and soon-upcoming events share one intentional ordering.
  const aDelta = getActivitySortDelta(a, now);
  const bDelta = getActivitySortDelta(b, now);

  if (aDelta !== bDelta) {
    return aDelta - bDelta;
  }

  const aTime = getActivitySortTime(a);
  const bTime = getActivitySortTime(b);

  if (aTime !== bTime) {
    return bTime - aTime;
  }

  return a.id.localeCompare(b.id);
}

function getActivitySortDelta(item: DashboardActivityItem, now: number) {
  const time = getActivitySortTime(item);

  if (time === Number.NEGATIVE_INFINITY) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(time - now);
}

function getActivitySortTime(item: DashboardActivityItem) {
  if (!item.sortAt) {
    return Number.NEGATIVE_INFINITY;
  }

  const time = Date.parse(item.sortAt);
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
}
