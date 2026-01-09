import React, { useMemo, useState } from "react";

const PLANS_KEY = "trainingPlans:v1";
const COMPLETIONS_KEY = "trainingCompletions:v1"; // planId -> { sessionId -> completedAt }

function loadPlans() {
  try { return JSON.parse(localStorage.getItem(PLANS_KEY) || "[]"); }
  catch { return []; }
}
function savePlans(plans) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

function loadCompletions() {
  try { return JSON.parse(localStorage.getItem(COMPLETIONS_KEY) || "{}"); }
  catch { return {}; }
}
function saveCompletions(map) {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(map));
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const splitLine = (line) => {
    const out = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { out.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    out.push(cur.trim());
    return out;
  };

  const header = splitLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    const obj = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = cols[j] ?? "";
    rows.push(obj);
  }
  return rows;
}

function toPlanFromBcmCsvRows(rows, name) {
  const sessions = rows
    .map((r, idx) => {
      const week = Number(r["Uke"]);
      const date = (r["Dato"] || "").trim();
      const weekday = (r["Dag"] || "").trim();
      const type = (r["Økt-type"] || "").trim();
      const structure = (r["Økt / struktur"] || "").trim();

      if (!date || !type) return null;
      if (!Number.isFinite(week)) throw new Error(`Rad ${idx + 2}: "Uke" er ikke et tall`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Rad ${idx + 2}: "Dato" må være YYYY-MM-DD (fikk ${date})`);

      return { id: crypto.randomUUID(), week, date, weekday, type, structure };
    })
    .filter(Boolean);

  sessions.sort((a, b) => a.date.localeCompare(b.date));

  return {
    id: crypto.randomUUID(),
    name: name.trim() || "Uten navn",
    createdAt: new Date().toISOString(),
    sessions,
  };
}

function PlanList({ plans, onOpen, onImport, onReset }) {
  const meta = useMemo(() => {
    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      count: p.sessions?.length || 0,
      first: p.sessions?.[0]?.date,
      last: p.sessions?.[p.sessions.length - 1]?.date,
    }));
  }, [plans]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          id="planfile"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
          }}
        />
        <button
          onClick={onReset}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff" }}
        >
          Nullstill planer
        </button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {meta.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Ingen planer enda. Importer CSV.</div>
        ) : (
          meta.map((m) => (
            <button
              key={m.id}
              onClick={() => onOpen(m.id)}
              style={{
                textAlign: "left",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 12,
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 800 }}>{m.name}</div>
              <div style={{ opacity: 0.75, fontSize: 13 }}>
                {m.count} økter{m.first && m.last ? ` • ${m.first} → ${m.last}` : ""}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function PlanDetail({ plan, completionsForPlan, onBack, onToggleDone, doneCount }) {
  const [showOnCalendar, setShowOnCalendar] = useState(true);

  // startmåned = måneden til første økt i planen (eller dagens)
  const [monthDate, setMonthDate] = useState(() => {
    const first = plan.sessions?.[0]?.date;
    if (first) {
      const [y, m] = first.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const dateKey = (d) => {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const da = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  };

  const addDays = (d, n) => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() + n);
    return dt;
  };

  const buildMonthGrid = (year, monthIdx) => {
    const first = new Date(year, monthIdx, 1);
    const firstDow = (first.getDay() + 6) % 7; // 0=Mon
    const start = addDays(first, -firstDow);
    const days = [];
    for (let i = 0; i < 42; i++) days.push(addDays(start, i));
    return days;
  };

  const sessionsByDate = useMemo(() => {
    const map = new Map();
    for (const s of plan.sessions) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date).push(s);
    }
    return map;
  }, [plan.sessions]);

  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();
  const grid = useMemo(() => buildMonthGrid(y, m), [y, m]);
  const monthLabel = monthDate.toLocaleDateString("no-NO", { month: "long", year: "numeric" });
  const isInMonth = (d) => d.getMonth() === m;

  const weekdayLabels = ["ma", "ti", "on", "to", "fr", "lø", "sø"];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button
        onClick={onBack}
        style={{ width: "fit-content", padding: "6px 10px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff" }}
      >
        ← Tilbake
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{plan.name}</div>
          <div style={{ opacity: 0.75, fontSize: 13 }}>
            {doneCount}/{plan.sessions.length} gjennomført
          </div>
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "center", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={showOnCalendar}
            onChange={(e) => setShowOnCalendar(e.target.checked)}
          />
          Vis økter i kalender
        </label>
      </div>

      {/* Kalender */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, background: "#fff", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button
            onClick={() => setMonthDate(new Date(y, m - 1, 1))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "4px 8px", background: "transparent", cursor: "pointer" }}
            aria-label="Forrige måned"
          >
            ‹
          </button>

          <div style={{ fontWeight: 700, color: "#0f172a", textTransform: "capitalize" }}>{monthLabel}</div>

          <button
            onClick={() => setMonthDate(new Date(y, m + 1, 1))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "4px 8px", background: "transparent", cursor: "pointer" }}
            aria-label="Neste måned"
          >
            ›
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
          {weekdayLabels.map((w) => (
            <div key={w} style={{ color: "#64748b", fontSize: 12, textAlign: "center" }}>{w}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {grid.map((d, idx) => {
            const k = dateKey(d);
            const sessions = sessionsByDate.get(k) || [];
            const hasSessions = showOnCalendar && sessions.length > 0;

            // om noen av øktene den dagen er gjennomført
            const anyDone = sessions.some((s) => Boolean(completionsForPlan[s.id]));

            return (
              <div
                key={idx}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "8px 6px",
                  minHeight: 76,
                  background: hasSessions ? "rgba(0,0,0,0.03)" : "#fff",
                  opacity: isInMonth(d) ? 1 : 0.5,
                }}
                title={d.toLocaleDateString("no-NO")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{d.getDate()}</div>
                  {hasSessions && (
                    <div style={{ fontSize: 11, opacity: 0.75 }}>
                      {sessions.length}×{anyDone ? " ✓" : ""}
                    </div>
                  )}
                </div>

                {hasSessions && (
                  <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                    {sessions.slice(0, 2).map((s) => {
                      const done = Boolean(completionsForPlan[s.id]);
                      return (
                        <div
                          key={s.id}
                          title={s.structure}
                          style={{
                            fontSize: 11,
                            padding: "4px 6px",
                            borderRadius: 8,
                            border: "1px solid #ddd",
                            background: "#fff",
                            textDecoration: done ? "line-through" : "none",
                            opacity: done ? 0.65 : 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.type}
                        </div>
                      );
                    })}
                    {sessions.length > 2 && (
                      <div style={{ fontSize: 11, opacity: 0.75 }}>+{sessions.length - 2} flere</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Øktliste */}
      <div style={{ display: "grid", gap: 10 }}>
        {plan.sessions.map((s) => {
          const done = Boolean(completionsForPlan[s.id]);
          return (
            <div key={s.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: done ? "rgba(0,0,0,0.03)" : "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 800 }}>
                    {s.date} • Uke {s.week} • {s.weekday}
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>{s.type}</div>
                </div>

                <label style={{ display: "flex", gap: 8, alignItems: "center", userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => onToggleDone(s.id)}
                  />
                  Gjennomført
                </label>
              </div>

              <div style={{ marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.35 }}>
                {s.structure}
              </div>

              {done && completionsForPlan[s.id]?.completedAt && (
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                  Registrert: {new Date(completionsForPlan[s.id].completedAt).toLocaleString("no-NO")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PlanImportBlocks() {
  const [plans, setPlans] = useState(() => loadPlans());
  const [planName, setPlanName] = useState("");
  const [error, setError] = useState("");
  const [openPlanId, setOpenPlanId] = useState(null);

  const [completions, setCompletions] = useState(() => loadCompletions());

  const openPlan = useMemo(() => plans.find((p) => p.id === openPlanId) || null, [plans, openPlanId]);
  const completionsForPlan = useMemo(() => {
    if (!openPlanId) return {};
    return completions[openPlanId] || {};
  }, [completions, openPlanId]);

  const doneCount = useMemo(() => {
    if (!openPlan) return 0;
    const map = completionsForPlan || {};
    return openPlan.sessions.reduce((n, s) => n + (map[s.id] ? 1 : 0), 0);
  }, [openPlan, completionsForPlan]);

  async function onImport(file) {
    setError("");
    try {
      const text = await file.text();
      const rows = parseCsv(text);

      const name = (planName || file.name.replace(/\.csv$/i, "")).trim();
      const plan = toPlanFromBcmCsvRows(rows, name);

      const next = [plan, ...plans];
      setPlans(next);
      savePlans(next);
      setPlanName("");
    } catch (e) {
      setError(e?.message || "Import feilet");
    }
  }

  function onReset() {
    savePlans([]);
    setPlans([]);
    // la completions ligge, men du kan også resette:
    saveCompletions({});
    setCompletions({});
    setOpenPlanId(null);
  }

  function onToggleDone(sessionId) {
    const planId = openPlanId;
    if (!planId) return;

    const next = { ...completions };
    const forPlan = { ...(next[planId] || {}) };

    if (forPlan[sessionId]) {
      delete forPlan[sessionId];
    } else {
      forPlan[sessionId] = { sessionId, completedAt: new Date().toISOString() };
    }

    next[planId] = forPlan;
    setCompletions(next);
    saveCompletions(next);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="Navn på treningsplan"
          style={{ padding: 8, borderRadius: 10, border: "1px solid #cbd5e1", minWidth: 260 }}
        />
      </div>

      {error && <div style={{ color: "crimson" }}>{error}</div>}

      {!openPlan ? (
        <PlanList
          plans={plans}
          onOpen={setOpenPlanId}
          onImport={onImport}
          onReset={onReset}
        />
      ) : (
        <PlanDetail
          plan={openPlan}
          completionsForPlan={completionsForPlan}
          doneCount={doneCount}
          onBack={() => setOpenPlanId(null)}
          onToggleDone={onToggleDone}
        />
      )}
    </div>
  );
}