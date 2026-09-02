import { describe, expect, it } from "vitest";

import { emptySchedule, scheduleFromIntervals, validateSchedule } from "./validation";
import type { EditableSchedule } from "./validation";
import type { WorkingHourInterval } from "./types";

function scheduleWith(day: keyof EditableSchedule, rows: EditableSchedule[keyof EditableSchedule]) {
  const schedule = emptySchedule();
  schedule[day] = rows;
  return schedule;
}

describe("validateSchedule — empty schedule", () => {
  it("accepts a schedule with every day empty", () => {
    const result = validateSchedule(emptySchedule());

    expect(result).toEqual({ ok: true, intervals: [] });
  });
});

describe("validateSchedule — single interval per row", () => {
  it("rejects a missing start time", () => {
    const result = validateSchedule(scheduleWith("MONDAY", [{ start: "", end: "12:00" }]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { day: "MONDAY", index: 0, message: "Enter both a start and end time." },
      ]);
    }
  });

  it("rejects a missing end time", () => {
    const result = validateSchedule(scheduleWith("MONDAY", [{ start: "09:00", end: "" }]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].message).toBe("Enter both a start and end time.");
    }
  });

  it("rejects start equal to end", () => {
    const result = validateSchedule(scheduleWith("MONDAY", [{ start: "09:00", end: "09:00" }]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { day: "MONDAY", index: 0, message: "Start time must be before end time." },
      ]);
    }
  });

  it("rejects start after end", () => {
    const result = validateSchedule(scheduleWith("MONDAY", [{ start: "17:00", end: "09:00" }]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].message).toBe("Start time must be before end time.");
    }
  });

  it("accepts a single valid interval", () => {
    const result = validateSchedule(scheduleWith("TUESDAY", [{ start: "09:00", end: "17:00" }]));

    expect(result).toEqual({
      ok: true,
      intervals: [{ day_of_week: "TUESDAY", start_time: "09:00", end_time: "17:00" }],
    });
  });
});

describe("validateSchedule — touching boundaries (S5's explicit rule)", () => {
  it("accepts A.end === B.start as a valid split shift", () => {
    const result = validateSchedule(
      scheduleWith("MONDAY", [
        { start: "09:00", end: "12:00" },
        { start: "12:00", end: "17:00" },
      ])
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.intervals).toEqual([
        { day_of_week: "MONDAY", start_time: "09:00", end_time: "12:00" },
        { day_of_week: "MONDAY", start_time: "12:00", end_time: "17:00" },
      ]);
    }
  });

  it("accepts touching boundaries regardless of entry order", () => {
    const result = validateSchedule(
      scheduleWith("MONDAY", [
        { start: "12:00", end: "17:00" },
        { start: "09:00", end: "12:00" },
      ])
    );

    expect(result.ok).toBe(true);
  });

  it("accepts three touching intervals in a row", () => {
    const result = validateSchedule(
      scheduleWith("MONDAY", [
        { start: "09:00", end: "12:00" },
        { start: "12:00", end: "15:00" },
        { start: "15:00", end: "18:00" },
      ])
    );

    expect(result.ok).toBe(true);
  });
});

describe("validateSchedule — overlap", () => {
  it("rejects a partial overlap", () => {
    const result = validateSchedule(
      scheduleWith("MONDAY", [
        { start: "09:00", end: "12:00" },
        { start: "10:00", end: "13:00" },
      ])
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        {
          day: "MONDAY",
          index: 1,
          message: "Working hours cannot overlap with another interval.",
        },
      ]);
    }
  });

  it("rejects one interval fully containing another", () => {
    const result = validateSchedule(
      scheduleWith("MONDAY", [
        { start: "09:00", end: "18:00" },
        { start: "10:00", end: "12:00" },
      ])
    );

    expect(result.ok).toBe(false);
  });

  it("rejects overlap regardless of entry order", () => {
    const result = validateSchedule(
      scheduleWith("MONDAY", [
        { start: "10:00", end: "13:00" },
        { start: "09:00", end: "12:00" },
      ])
    );

    expect(result.ok).toBe(false);
  });
});

describe("validateSchedule — duplicates", () => {
  it("rejects an exact duplicate interval", () => {
    const result = validateSchedule(
      scheduleWith("MONDAY", [
        { start: "09:00", end: "17:00" },
        { start: "09:00", end: "17:00" },
      ])
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { day: "MONDAY", index: 1, message: "This interval is a duplicate." },
      ]);
    }
  });
});

describe("validateSchedule — multiple days", () => {
  it("accepts a full week with split shifts, single intervals, and non-working days", () => {
    const schedule = emptySchedule();
    schedule.MONDAY = [
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "17:00" },
    ];
    schedule.TUESDAY = [{ start: "09:00", end: "17:00" }];
    // WEDNESDAY left empty: not working.
    schedule.THURSDAY = [{ start: "10:00", end: "18:00" }];
    schedule.FRIDAY = [{ start: "09:00", end: "16:00" }];
    schedule.SATURDAY = [{ start: "10:00", end: "14:00" }];
    // SUNDAY left empty: not working.

    const result = validateSchedule(schedule);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.intervals).toHaveLength(6);
      expect(result.intervals.filter((i) => i.day_of_week === "WEDNESDAY")).toHaveLength(0);
      expect(result.intervals.filter((i) => i.day_of_week === "SUNDAY")).toHaveLength(0);
    }
  });

  it("reports errors on more than one day without one hiding the other", () => {
    const schedule = emptySchedule();
    schedule.MONDAY = [{ start: "09:00", end: "09:00" }];
    schedule.TUESDAY = [
      { start: "09:00", end: "12:00" },
      { start: "10:00", end: "13:00" },
    ];

    const result = validateSchedule(schedule);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(2);
      expect(result.errors.map((e) => e.day).sort()).toEqual(["MONDAY", "TUESDAY"]);
    }
  });

  it("a valid day is unaffected by an invalid day elsewhere in the week", () => {
    const schedule = emptySchedule();
    schedule.MONDAY = [{ start: "09:00", end: "09:00" }]; // invalid
    schedule.TUESDAY = [{ start: "09:00", end: "17:00" }]; // valid

    const result = validateSchedule(schedule);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { day: "MONDAY", index: 0, message: "Start time must be before end time." },
      ]);
    }
  });
});

describe("scheduleFromIntervals / emptySchedule", () => {
  it("groups a flat interval list by day", () => {
    const intervals: WorkingHourInterval[] = [
      { day_of_week: "MONDAY", start_time: "09:00", end_time: "12:00" },
      { day_of_week: "MONDAY", start_time: "13:00", end_time: "17:00" },
      { day_of_week: "TUESDAY", start_time: "09:00", end_time: "17:00" },
    ];

    const schedule = scheduleFromIntervals(intervals);

    expect(schedule.MONDAY).toEqual([
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "17:00" },
    ]);
    expect(schedule.TUESDAY).toEqual([{ start: "09:00", end: "17:00" }]);
    expect(schedule.WEDNESDAY).toEqual([]);
    expect(schedule.SUNDAY).toEqual([]);
  });

  it("every day of an empty schedule is an empty array, never missing", () => {
    const schedule = emptySchedule();

    for (const day of [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ] as const) {
      expect(schedule[day]).toEqual([]);
    }
  });
});
