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
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button
        onClick={onBack}
        style={{ width: "fit-content", padding: "6px 10px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff" }}
      >
        ← Tilbake
      </button>

      <div>
        <div style={{ fontWeight: 900, fontSize: 18 }}>{plan.name}</div>
        <div style={{ opacity: 0.75, fontSize: 13 }}>
          {doneCount}/{plan.sessions.length} gjennomført
        </div>
      </div>

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