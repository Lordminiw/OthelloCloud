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

export type CalendarEventMeta = {
  notes?: string;
  requestParticipation?: boolean;
  requestedMemberIds?: string[];
  responses?: Record<string, "pending" | "yes" | "no">;
};

export function parseCalendarEventMeta(
  description?: string
): CalendarEventMeta {
  if (!description?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(description);

    return {
      notes:
        typeof parsed.notes === "string" && parsed.notes.trim()
          ? parsed.notes
          : "",
      requestParticipation: Boolean(parsed.requestParticipation),
      requestedMemberIds: Array.isArray(parsed.requestedMemberIds)
        ? parsed.requestedMemberIds.filter(
            (value: unknown): value is string => typeof value === "string"
          )
        : [],
      responses:
        parsed.responses && typeof parsed.responses === "object"
          ? (Object.fromEntries(
              Object.entries(parsed.responses).filter(
                ([, value]) =>
                  value === "pending" || value === "yes" || value === "no"
              )
            ) as Record<string, "pending" | "yes" | "no">)
          : {},
    };
  } catch {
    return {
      notes: description,
      requestParticipation: false,
      requestedMemberIds: [],
      responses: {},
    };
  }
}

export function serializeCalendarEventMeta(meta: CalendarEventMeta): string {
  const payload: CalendarEventMeta = {};

  if (meta.notes?.trim()) {
    payload.notes = meta.notes.trim();
  }

  if (meta.requestParticipation) {
    payload.requestParticipation = true;
  }

  if (meta.requestedMemberIds?.length) {
    payload.requestedMemberIds = [...new Set(meta.requestedMemberIds)];
  }

  if (meta.responses && Object.keys(meta.responses).length > 0) {
    payload.responses = meta.responses;
  }

  return Object.keys(payload).length > 0 ? JSON.stringify(payload) : "";
}

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
  notes?: string;
  requestParticipation?: boolean;
  requestedMemberIds?: string[];
  responses?: Record<string, "pending" | "yes" | "no">;
}) {
  return await pb.collection("calendar_events").create({
    household: input.householdId,
    title: input.title,
    start: input.startIso,
    end: input.endIso || "",
    location: input.location || "",
    description: serializeCalendarEventMeta({
      notes: input.notes,
      requestParticipation: input.requestParticipation,
      requestedMemberIds: input.requestedMemberIds,
      responses: input.responses,
    }),
    createdBy: pb.authStore.model?.id,
  });
}

export async function deleteCalendarEvent(eventId: string) {
  return await pb.collection("calendar_events").delete(eventId);
}

export async function updateCalendarEvent(
  eventId: string,
  input: {
    title: string;
    startIso: string;
    endIso?: string;
    location?: string;
    notes?: string;
    requestParticipation?: boolean;
    requestedMemberIds?: string[];
    responses?: Record<string, "pending" | "yes" | "no">;
  }
) {
  return await pb.collection("calendar_events").update(eventId, {
    title: input.title,
    start: input.startIso,
    end: input.endIso || "",
    location: input.location || "",
    description: serializeCalendarEventMeta({
      notes: input.notes,
      requestParticipation: input.requestParticipation,
      requestedMemberIds: input.requestedMemberIds,
      responses: input.responses,
    }),
  });
}
