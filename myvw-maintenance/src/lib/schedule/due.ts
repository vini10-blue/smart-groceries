import { addMonths, differenceInCalendarDays } from "date-fns";
import type { Car, MaintenanceRecord } from "../types";
import { milesToUnit } from "../format";
import type { ResolvedService } from "./applicability";

export type DueLevel = "overdue" | "due_soon" | "ok" | "unknown";

export interface DueStatus {
  service: ResolvedService;
  level: DueLevel;
  last?: MaintenanceRecord;
  /** Distance until/over due, in the car's unit (negative = overdue). */
  distanceRemaining?: number;
  /** Days until/over due (negative = overdue). */
  daysRemaining?: number;
  summary: string;
}

// "Due soon" lead times. Configurable from app settings.
let leadMiles = 300;
let leadDays = 30;

export function configureReminders(miles: number, days: number) {
  leadMiles = miles;
  leadDays = days;
}

function latestRecordFor(
  serviceKey: string,
  records: MaintenanceRecord[],
): MaintenanceRecord | undefined {
  return records.find((r) => r.serviceKey === serviceKey);
}

export function computeDue(
  car: Car,
  service: ResolvedService,
  records: MaintenanceRecord[],
  now: Date = new Date(),
): DueStatus {
  const last = latestRecordFor(service.key, records);

  const intervalDist =
    service.intervalMiles != null
      ? milesToUnit(service.intervalMiles, car.distanceUnit)
      : null;
  const intervalMonths = service.intervalMonths ?? null;

  if (!last) {
    return { service, level: "unknown", summary: "Not logged yet" };
  }

  let distanceRemaining: number | undefined;
  let daysRemaining: number | undefined;
  const reasons: DueLevel[] = [];

  const leadDist = milesToUnit(leadMiles, car.distanceUnit);

  if (intervalDist != null && typeof last.odometer === "number") {
    const dueAt = last.odometer + intervalDist;
    distanceRemaining = Math.round(dueAt - car.odometer);
    if (distanceRemaining <= 0) reasons.push("overdue");
    else if (distanceRemaining <= leadDist) reasons.push("due_soon");
    else reasons.push("ok");
  }

  if (intervalMonths != null) {
    const dueDate = addMonths(new Date(last.date), intervalMonths);
    daysRemaining = differenceInCalendarDays(dueDate, now);
    if (daysRemaining <= 0) reasons.push("overdue");
    else if (daysRemaining <= leadDays) reasons.push("due_soon");
    else reasons.push("ok");
  }

  let level: DueLevel = "ok";
  if (reasons.length === 0) level = "unknown";
  else if (reasons.includes("overdue")) level = "overdue";
  else if (reasons.includes("due_soon")) level = "due_soon";

  return {
    service,
    level,
    last,
    distanceRemaining,
    daysRemaining,
    summary: summarise(level, distanceRemaining, daysRemaining, car.distanceUnit),
  };
}

function summarise(
  level: DueLevel,
  dist: number | undefined,
  days: number | undefined,
  unit: string,
): string {
  if (level === "unknown") return "Not logged yet";
  const parts: string[] = [];
  if (dist != null) parts.push(`${Math.abs(dist).toLocaleString()} ${unit}`);
  if (days != null) parts.push(`${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`);
  const metric = parts.join(" / ");
  if (level === "overdue") return metric ? `Overdue by ${metric}` : "Overdue";
  if (level === "due_soon") return metric ? `Due in ${metric}` : "Due soon";
  return metric ? `OK — ${metric} left` : "OK";
}

const LEVEL_RANK: Record<DueLevel, number> = {
  overdue: 0,
  due_soon: 1,
  unknown: 2,
  ok: 3,
};

export function computeAllDue(
  car: Car,
  services: ResolvedService[],
  records: MaintenanceRecord[],
  now: Date = new Date(),
): DueStatus[] {
  return services
    .map((s) => computeDue(car, s, records, now))
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);
}
