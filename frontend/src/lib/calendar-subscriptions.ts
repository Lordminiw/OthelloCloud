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

export type CalendarUploadFile = {
  name: string;
  blob: Blob;
};

export async function loadOwnedCalendarSubscriptions() {
  const userId = pb.authStore.model?.id;
  if (!userId) return [];

  return await pb.collection("calendar_subscriptions").getFullList<CalendarSubscription>({
    filter: `owner = "${userId}"`,
    sort: "name",
    requestKey: null,
  });
}
export async function loadAccessibleCalendarSubscriptions() {
  return await pb.collection("calendar_subscriptions").getFullList<CalendarSubscription>({
    filter: "enabled = true",
    sort: "name",
    requestKey: null,
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

export async function uploadCalendarFile(input: {
  householdId: string;
  name?: string;
  file: CalendarUploadFile;
}) {
  const formData = new FormData();
  formData.append("householdId", input.householdId);
  formData.append("name", input.name?.trim() || input.file.name);
  formData.append("file", input.file.blob, input.file.name);

  return await pb.send<CalendarSyncResult>("/api/calendar-imports/upload", {
    method: "POST",
    body: formData,
  });
}

export type CalendarSubscriptionUnsubscribe = {
  id: string;
  user: string;
  subscription: string;
};

function isMissingCollectionContext(error: any) {
  const message = String(
    error?.response?.message ??
      error?.response?.data?.message ??
      error?.message ??
      ""
  );

  return message.includes("Missing collection context");
}

export async function loadUserUnsubscribes(): Promise<CalendarSubscriptionUnsubscribe[]> {
  const userId = pb.authStore.model?.id;
  if (!userId) return [];

  try {
    return await pb
      .collection("calendar_subscription_unsubscribes")
      .getFullList<CalendarSubscriptionUnsubscribe>({
        filter: `user = "${userId}"`,
        requestKey: null,
      });
  } catch (error) {
    if (isMissingCollectionContext(error)) {
      return [];
    }

    throw error;
  }
}

export async function unsubscribeFromCalendarSubscription(subscriptionId: string) {
  const userId = pb.authStore.model?.id;
  if (!userId) throw new Error("User not authenticated");

  try {
    return await pb.collection("calendar_subscription_unsubscribes").create({
      user: userId,
      subscription: subscriptionId,
    });
  } catch (error) {
    if (isMissingCollectionContext(error)) {
      throw new Error(
        "Calendar subscription preferences are not available on this server yet."
      );
    }

    throw error;
  }
}

export async function subscribeToCalendarSubscription(subscriptionId: string) {
  const userId = pb.authStore.model?.id;
  if (!userId) throw new Error("User not authenticated");

  let records;
  try {
    records = await pb.collection("calendar_subscription_unsubscribes").getFullList({
      filter: `user = "${userId}" && subscription = "${subscriptionId}"`,
      requestKey: null,
    });
  } catch (error) {
    if (isMissingCollectionContext(error)) {
      throw new Error(
        "Calendar subscription preferences are not available on this server yet."
      );
    }

    throw error;
  }

  if (records.length > 0) {
    await pb.collection("calendar_subscription_unsubscribes").delete(records[0].id);
  }
}
