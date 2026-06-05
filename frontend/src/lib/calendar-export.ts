import { buildPocketBaseUrl, pb } from "./pocketbase";

export type CalendarExportSettings = {
  householdId: string;
  feedPath: string;
  feedUrl?: string;
};

export async function loadCalendarExportSettings(householdId: string) {
  const result = await pb.send<CalendarExportSettings>(
    `/api/households/${householdId}/calendar-export`,
    { method: "GET" }
  );
  const feedUrl = buildPocketBaseUrl(result.feedPath || result.feedUrl || "");

  return {
    ...result,
    feedUrl,
  };
}

export async function rotateCalendarExportLink(householdId: string) {
  const result = await pb.send<CalendarExportSettings>(
    `/api/households/${householdId}/calendar-export/rotate`,
    { method: "POST" }
  );
  const feedUrl = buildPocketBaseUrl(result.feedPath || result.feedUrl || "");

  return {
    ...result,
    feedUrl,
  };
}
