import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db/schema";
import { DEFAULT_SETTINGS, type AppSettings } from "./types";

/** Reactive app settings, always resolved with defaults. */
export function useSettings(): AppSettings {
  const s = useLiveQuery(() => db.settings.get("app"), []);
  return s ? { ...DEFAULT_SETTINGS, ...s } : DEFAULT_SETTINGS;
}
