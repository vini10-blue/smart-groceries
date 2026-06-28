import { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { repo, newId } from "../lib/db/repo";
import { useSettings } from "../lib/useSettings";
import { CURRENCIES } from "../lib/format";
import {
  SERVICE_CATEGORY_LABELS,
  type DistanceUnit,
  type PresetService,
  type ServiceCategory,
} from "../lib/types";

export function Settings() {
  const settings = useSettings();

  const [currency, setCurrency] = useState(settings.defaultCurrency);
  const [unit, setUnit] = useState<DistanceUnit>(settings.defaultDistanceUnit);
  const [performedBy, setPerformedBy] = useState(settings.defaultPerformedBy);
  const [leadMiles, setLeadMiles] = useState(String(settings.reminderLeadMiles));
  const [leadDays, setLeadDays] = useState(String(settings.reminderLeadDays));
  const [notify, setNotify] = useState(settings.notificationsEnabled);
  const [presets, setPresets] = useState<PresetService[]>(settings.presets);
  const [saved, setSaved] = useState(false);

  // Keep local state in step with synced settings on first load / remote change.
  useEffect(() => {
    setCurrency(settings.defaultCurrency);
    setUnit(settings.defaultDistanceUnit);
    setPerformedBy(settings.defaultPerformedBy);
    setLeadMiles(String(settings.reminderLeadMiles));
    setLeadDays(String(settings.reminderLeadDays));
    setNotify(settings.notificationsEnabled);
    setPresets(settings.presets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.updatedAt]);

  // Preset editor form
  const [pName, setPName] = useState("");
  const [pCat, setPCat] = useState<ServiceCategory>("engine");
  const [pMiles, setPMiles] = useState("");
  const [pMonths, setPMonths] = useState("");
  const [pChecklist, setPChecklist] = useState("");

  function addPreset() {
    if (!pName.trim()) return;
    const preset: PresetService = {
      key: "preset:" + newId(),
      name: pName.trim(),
      category: pCat,
      intervalMiles: pMiles === "" ? null : Number(pMiles),
      intervalMonths: pMonths === "" ? null : Number(pMonths),
      checklist: pChecklist.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    setPresets((p) => [...p, preset]);
    setPName("");
    setPMiles("");
    setPMonths("");
    setPChecklist("");
  }

  async function onNotifyToggle(on: boolean) {
    if (on && "Notification" in window && Notification.permission !== "granted") {
      const res = await Notification.requestPermission();
      if (res !== "granted") {
        setNotify(false);
        return;
      }
    }
    setNotify(on);
  }

  async function save() {
    await repo.settings.save({
      defaultCurrency: currency,
      defaultDistanceUnit: unit,
      defaultPerformedBy: performedBy.trim() || "DIY",
      reminderLeadMiles: Number(leadMiles) || 0,
      reminderLeadDays: Number(leadDays) || 0,
      notificationsEnabled: notify,
      presets,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <Layout title="Settings" back>
      <div className="section-title">Defaults</div>
      <div className="card">
        <div className="grid2">
          <div className="field">
            <label>Default currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Default units</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value as DistanceUnit)}>
              <option value="mi">miles</option>
              <option value="km">km</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Default "performed by"</label>
          <input value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} placeholder="DIY" />
        </div>
      </div>

      <div className="section-title">Reminders</div>
      <div className="card">
        <p className="small muted" style={{ marginTop: 0 }}>
          Flag a service as "due soon" when it's within this much of being due.
        </p>
        <div className="grid2">
          <div className="field">
            <label>Lead distance ({unit})</label>
            <input type="number" value={leadMiles} onChange={(e) => setLeadMiles(e.target.value)} />
          </div>
          <div className="field">
            <label>Lead time (days)</label>
            <input type="number" value={leadDays} onChange={(e) => setLeadDays(e.target.value)} />
          </div>
        </div>
        <label className="row" style={{ padding: "6px 0", cursor: "pointer" }}>
          <input type="checkbox" checked={notify} onChange={(e) => onNotifyToggle(e.target.checked)} />
          <span className="list-item__main">
            <div className="list-item__title">Notify me when I open the app</div>
            <div className="small muted">
              Shows an alert if anything is due/overdue. (Phones can't notify while
              the app is closed — that needs email reminders, which we can add later.)
            </div>
          </span>
        </label>
      </div>

      <div className="section-title">Preset services</div>
      <div className="card">
        <p className="small muted" style={{ marginTop: 0 }}>
          Your own service templates. They appear in every car's suggestions and as
          quick picks when logging a service.
        </p>
        {presets.length === 0 && <div className="small muted">No presets yet.</div>}
        {presets.map((p) => (
          <div key={p.key} className="list-item">
            <div className="list-item__main">
              <div className="list-item__title">{p.name}</div>
              <div className="small muted">
                {SERVICE_CATEGORY_LABELS[p.category]}
                {p.intervalMiles ? ` · ${p.intervalMiles.toLocaleString()} ${unit}` : ""}
                {p.intervalMonths ? ` · ${p.intervalMonths} mo` : ""}
              </div>
            </div>
            <button
              className="btn btn--sm btn--danger"
              onClick={() => setPresets((arr) => arr.filter((x) => x.key !== p.key))}
            >
              Remove
            </button>
          </div>
        ))}

        <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          <div className="field">
            <label>New preset name</label>
            <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. Wax & polish" />
          </div>
          <div className="field">
            <label>Category</label>
            <select value={pCat} onChange={(e) => setPCat(e.target.value as ServiceCategory)}>
              {Object.entries(SERVICE_CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>
          <div className="grid2">
            <div className="field">
              <label>Every ({unit}, optional)</label>
              <input type="number" value={pMiles} onChange={(e) => setPMiles(e.target.value)} />
            </div>
            <div className="field">
              <label>Every (months, optional)</label>
              <input type="number" value={pMonths} onChange={(e) => setPMonths(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Checklist (one step per line, optional)</label>
            <textarea value={pChecklist} onChange={(e) => setPChecklist(e.target.value)} />
          </div>
          <button className="btn btn--sm" onClick={addPreset}>+ Add preset</button>
        </div>
      </div>

      <div className="fab-spacer" />
      <button className="btn btn--primary btn--block" onClick={save}>
        {saved ? "Saved ✓" : "Save settings"}
      </button>
    </Layout>
  );
}
