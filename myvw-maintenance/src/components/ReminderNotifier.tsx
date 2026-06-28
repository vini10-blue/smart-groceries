import { useEffect } from "react";
import { repo } from "../lib/db/repo";
import { resolveServicesForCar } from "../lib/schedule/applicability";
import { computeAllDue, configureReminders } from "../lib/schedule/due";
import { todayIso } from "../lib/format";

const LAST_NOTIFY_KEY = "myvw_last_notify";

/**
 * When enabled, shows a single notification (at most once per day) summarising
 * services that are due or overdue. Phones can't notify while the app is closed,
 * so this fires shortly after the app opens. Renders nothing.
 */
export function ReminderNotifier() {
  useEffect(() => {
    let cancelled = false;
    // Give cloud sync a moment to pull the latest data first.
    const timer = setTimeout(async () => {
      const settings = await repo.settings.get();
      if (!settings.notificationsEnabled) return;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      if (localStorage.getItem(LAST_NOTIFY_KEY) === todayIso()) return;

      configureReminders(settings.reminderLeadMiles, settings.reminderLeadDays);
      const cars = await repo.cars.list();
      let overdue = 0;
      let soon = 0;
      for (const car of cars) {
        const records = await repo.records.listByCar(car.id);
        const services = resolveServicesForCar(car, settings.presets);
        for (const d of computeAllDue(car, services, records)) {
          if (d.level === "overdue") overdue++;
          else if (d.level === "due_soon") soon++;
        }
      }
      if (cancelled || (overdue === 0 && soon === 0)) return;

      const bits: string[] = [];
      if (overdue) bits.push(`${overdue} overdue`);
      if (soon) bits.push(`${soon} due soon`);
      new Notification("MyVW Maintenance", {
        body: `${bits.join(" · ")} across your garage. Tap to review.`,
        icon: "icon.svg",
      });
      localStorage.setItem(LAST_NOTIFY_KEY, todayIso());
    }, 4000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
