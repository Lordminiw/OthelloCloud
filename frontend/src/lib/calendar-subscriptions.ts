import { pb } from "./pocketbase";

export type CalendarSubscription = {
  id: string;
  household?: string;
  owner: string;
  sharedWithHousehold: boolean;
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

export async function loadOwnedCalendarSubscriptions() {
  const userId = pb.authStore.model?.id;
  if (!userId) return [];

  return await pb.collection("calendar_subscriptions").getFullList<CalendarSubscription>({
    filter: `owner = "${userId}"`,
    sort: "name",
  });
}

export async function loadAccessibleCalendarSubscriptions() {
  return await pb.collection("calendar_subscriptions").getFullList<CalendarSubscription>({
    filter: "enabled = true",
    sort: "name",
  });
}

export async function saveCalendarSubscription(input: {
  current: CalendarSubscription | null;
  householdId?: string;
  name: string;
  url: string;
  enabled: boolean;
  sharedWithHousehold: boolean;
}) {
  const data = {
    household: input.sharedWithHousehold ? input.householdId || "" : "",
    name: input.name.trim() || "External calendar",
    url: input.url.trim(),
    enabled: input.enabled,
    sharedWithHousehold: input.sharedWithHousehold,
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

export async function syncCalendarSubscription(subscriptionId: string) {
  return await pb.send<CalendarSyncResult>(
    `/api/calendar-subscriptions/${subscriptionId}/sync`,
    { method: "POST" }
  );
}
