import { createCalendarEvent, updateCalendarEvent } from "./calendar";
import { pb } from "./pocketbase";

const mockCollection = jest.mocked(pb.collection);
const create = jest.fn();
const update = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockCollection.mockReturnValue({ create, update } as any);
});

it("saves manual all-day calendar events without an end time requirement", async () => {
  await createCalendarEvent({
    householdId: "house-1",
    title: "Move-in day",
    startIso: "2026-06-20T00:00:00.000Z",
    allDay: true,
  });

  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({
      household: "house-1",
      title: "Move-in day",
      start: "2026-06-20T00:00:00.000Z",
      end: "",
      allDay: true,
    })
  );
});

it("updates the all-day flag for manual calendar events", async () => {
  await updateCalendarEvent("event-1", {
    title: "Move-in day",
    startIso: "2026-06-21T00:00:00.000Z",
    allDay: true,
  });

  expect(update).toHaveBeenCalledWith(
    "event-1",
    expect.objectContaining({
      title: "Move-in day",
      start: "2026-06-21T00:00:00.000Z",
      end: "",
      allDay: true,
    })
  );
});
