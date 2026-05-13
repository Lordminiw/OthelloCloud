import { pb } from "./pocketbase";

export type CalendarEvent = {
  id: string;
  household: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  description?: string;
  createdBy?: string;
};

export async function loadCalendarEventsForMonth(input: {
  householdId: string;
  year: number;
  month: number; // 0-based
}): Promise<CalendarEvent[]> {
  const monthStart = new Date(input.year, input.month, 1);
  const monthEnd = new Date(input.year, input.month + 1, 1);

  return await pb.collection("calendar_events").getFullList<CalendarEvent>({
    filter:
      `household = "${input.householdId}" && ` +
      `start < "${monthEnd.toISOString()}" && ` +
      `(end = "" || end >= "${monthStart.toISOString()}")`,
    sort: "start",
  });
}

export async function createCalendarEvent(input: {
  householdId: string;
  title: string;
  startIso: string;
  endIso?: string;
  location?: string;
  description?: string;
}) {
  return await pb.collection("calendar_events").create({
    household: input.householdId,
    title: input.title,
    start: input.startIso,
    end: input.endIso || "",
    location: input.location || "",
    description: input.description || "",
    createdBy: pb.authStore.model?.id,
  });
}

export async function deleteCalendarEvent(eventId: string) {
  return await pb.collection("calendar_events").delete(eventId);
}