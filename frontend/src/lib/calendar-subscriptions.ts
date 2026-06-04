import { pb } from "./pocketbase";

export type CalendarSubscription = {
  id: string;
  household: string;
  name: string;
  url?: string;
  enabled: boolean;
  lastSyncedAt?: string;
  lastSyncStatus?: "success" | "error";
  lastSyncMessage?: string;
};

export type CalendarSyncResult = {
  created: number;
  updated: number;
  removed: number;
};

export async function loadCalendarSubscription(householdId: string) {
  try {
    return await pb
      .collection("calendar_subscriptions")
      .getFirstListItem<CalendarSubscription>(`household = "${householdId}"`);
  } catch (error: any) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function saveCalendarSubscription(input: {
  current: CalendarSubscription | null;
  householdId: string;
  name: string;
  url: string;
  enabled: boolean;
}) {
  const data = {
    household: input.householdId,
    name: input.name.trim() || "External calendar",
    url: input.url.trim(),
    enabled: input.enabled,
  };

  if (input.current) {
    return await pb
      .collection("calendar_subscriptions")
      .update<CalendarSubscription>(input.current.id, data);
  }

  return await pb
    .collection("calendar_subscriptions")
    .create<CalendarSubscription>(data);
}

export async function syncCalendarSubscription(householdId: string) {
  return await pb.send<CalendarSyncResult>(
    `/api/households/${householdId}/calendar-subscription/sync`,
    { method: "POST" }
  );
}
