import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Trophy, List, PlusCircle, Layers, ArrowLeft, Clock } from "lucide-react";

const WARM_ORANGE = "#ff7a1a";

/* ================================
   Utils + API
================================ */

// API-klient
const api = axios.create({ baseURL: "/api" });

// Etiketter og farger per sport
const SPORT_LABELS = { run: "Løping", cycle: "Sykling", swim: "Svømming" };
const SPORT_COLORS = { run: "#ff7a1a", cycle: "#3b82f6", swim: "#10b981" };

// Varighet -> "MM:SS" eller "H:MM:SS" når >= 1 time
const fmtDuration = (seconds) => {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n < 0) return "–";
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = Math.floor(n % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
};

// Godtar "SS", "MM:SS" eller "HH:MM:SS" -> sekunder (Number)
const parseDuration = (val) => {
  if (val == null || val === "") return null;
  if (/^\d+$/.test(val)) return Number(val);           // bare sekunder
  // HH:MM:SS
  let m = val.match(/^(\d+):([0-5]?\d):([0-5]?\d)$/);
  if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  // MM:SS
  m = val.match(/^(\d+):([0-5]?\d)$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return NaN;
};


// spesifike formater for sportene
const fmtPaceMinPerKm = (seconds, km) => {
  const s = Number(seconds), d = Number(km);
  if (!Number.isFinite(s) || !Number.isFinite(d) || d <= 0) return "–";
  const pace = s / d; // sek/km
  const m = Math.floor(pace / 60);
  const sec = Math.round(pace % 60).toString().padStart(2, "0");
  return `${m}:${sec} min/km`;
};
const fmtSpeedKph = (seconds, km) => {
  const s = Number(seconds), d = Number(km);
  if (!Number.isFinite(s) || !Number.isFinite(d) || s <= 0) return "–";
  const kph = d / (s / 3600);
  return `${kph.toFixed(1)} km/t`;
};
const fmtSwimPacePer100m = (seconds, km) => {
  const s = Number(seconds), d = Number(km);
  if (!Number.isFinite(s) || !Number.isFinite(d) || d <= 0) return "–";
  const secPer100 = s / (d * 10); // 1 km = 10 x 100m
  const m = Math.floor(secPer100 / 60);
  const sec = Math.round(secPer100 % 60).toString().padStart(2, "0");
  return `${m}:${sec} /100m`;
};

// Dato-hjelpere til kalender/uke
const dateKey = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const da = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt; };
const isSameDay = (a, b) => dateKey(a) === dateKey(b);
const startOfWeek = (d) => {
  const dt = new Date(d);
  const day = (dt.getDay() + 6) % 7; // 0=Mon ... 6=Sun
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() - day);
  return dt;
};
// 6x7 rutenett for kalender
const buildMonthGrid = (year, monthIdx) => {
  const first = new Date(year, monthIdx, 1);
  const firstDow = (first.getDay() + 6) % 7; // 0=Mon
  const start = addDays(first, -firstDow);
  const days = [];
  for (let i = 0; i < 42; i++) days.push(addDays(start, i));
  return days;
};
// ukenummer og etikett "Uke NN – dd.mm–dd.mm"
const getISOWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};
const formatWeekRangeLabel = (weekStart) => {
  const ws = new Date(weekStart);
  const we = addDays(ws, 6);
  const opts = { day: "2-digit", month: "2-digit" };
  const startStr = ws.toLocaleDateString("no-NO", opts);
  const endStr = we.toLocaleDateString("no-NO", opts);
  const weekNo = getISOWeekNumber(ws);
  return `${weekNo} – ${startStr}–${endStr}`;
};

// Lokal tid -> "YYYY-MM-DDTHH:mm"
const formatLocalDatetime = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/* ================================
   Layout
================================ */

const Shell = ({ children }) => {
  const { pathname } = useLocation();
  const overlay = pathname === "/"; // navbar over bildet på forsiden

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f0f9ff,white,#f5f3ff)" }}>
      <header
        style={{
          position: overlay ? "absolute" : "sticky",
          top: 0, left: 0, right: 0, zIndex: 20,
          background: overlay ? "transparent" : "rgba(255,255,255,0.7)",
          borderBottom: overlay ? "none" : "1px solid rgba(203,213,225,0.6)",
          backdropFilter: overlay ? "none" : "saturate(180%) blur(6px)",
        }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: overlay ? "#fff" : "#0f172a" }}>
            <span style={{ fontWeight: 700, fontFamily: '"Sora", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif' }}>
              kilometers.
            </span>
          </Link>
          <nav style={{ display: "flex", gap: 8 }}>
            <Nav to="/add" label="Ny aktivitet" overlay={overlay} icon={<PlusCircle size={16} />} />
            <Nav to="/activities" label="Aktiviteter" overlay={overlay} icon={<List size={16} />} />
            <Nav to="/blocks" label="Treningsblokker" overlay={overlay} icon={<Layers size={16} />} />
            <Nav to="/achievements" label="Prestasjoner" overlay={overlay} icon={<Trophy size={16} />} />
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: overlay ? "0 16px 32px" : "32px 16px" }}>{children}</main>

      {!overlay && (<footer style={{ padding: "40px 0", textAlign: "center", fontSize: 12, color: "#6b7280" }}>© {new Date().getFullYear()} kilometers.</footer>)}
    </div>
  );
};

const Nav = ({ to, label, icon, overlay = false }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 9999,
      border: `1px solid ${isActive ? "#0f172a" : overlay ? "rgba(255,255,255,0.7)" : "#cbd5e1"}`,
      color: overlay ? "#fff" : isActive ? "#0f172a" : "#334155",
      textDecoration: "none",
      background: overlay ? "rgba(255,255,255,0.06)" : "transparent",
    })}
  >
    {icon}
    {label}
  </NavLink>
);

/* ================================
   Home 
================================ */

// Hook: viewport height 
const useViewportHeight = () => {
  const [h, setH] = useState(null);
  useEffect(() => {
    const set = () => setH(window.innerHeight);
    set();
    window.addEventListener('resize', set);
    window.addEventListener('orientationchange', set);
    return () => {
      window.removeEventListener('resize', set);
      window.removeEventListener('orientationchange', set);
    };
  }, []);
  return h;
};

const FRONTPAGE = "/frontpage2.jpg";

const Home = () => {
  const vh = useViewportHeight();
  return (
    <div>
      <section style={{ position: 'relative', width: '100vw', left: '50%', transform: 'translateX(-50%)' }}>
        <div style={{ position: 'relative', height: vh ? `${vh}px` : '100vh' }}>
          <img
            src={FRONTPAGE}
            alt="kilometers. "
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
          <div style={{ position: 'absolute', left: '50%', bottom: '24vh', transform: 'translateX(-50%)', textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(36px, 7vw, 88px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#ff7a1a', fontFamily: '"Sora", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif' }}>
              kilometers.
            </h1>
          </div>
          <div style={{ position: 'absolute', left: 16, bottom: 12, color: '#9ca3af', fontSize: 12, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
            © {new Date().getFullYear()} kilometers.
          </div>
        </div>
      </section>
    </div>
  );
};

/* ================================
   Add Activity (form)
================================ */

const AddActivityPage = () => {
  const navigate = useNavigate();
  return (
    
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <BackLink />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
          Legg til ny aktivitet
        </h2>
        <ActivityForm onSaved={() => navigate("/activities")} />
      </div>
    </div>
  );
};

const BackLink = () => (
  <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#475569', marginBottom: 16, textDecoration: 'none' }}>
    <ArrowLeft size={16} /> Til forsiden
  </Link>
);

const ActivityForm = ({ onSaved }) => {
  const [sport, setSport] = useState("run");          // run | cycle | swim
  const [distance, setDistance] = useState("");       // km for run/cycle, meter for swim (input)
  const [duration, setDuration] = useState("");  // "HH:MM:SS" 
  const [date, setDate] = useState(() => formatLocalDatetime(new Date())); // dagens dato
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // live preview
  const distanceKmForPreview = (() => {
    const val = Number(distance);
    if (!Number.isFinite(val) || val <= 0) return null;
    return sport === "swim" ? val / 1000 : val; // meter -> km for svømming
  })();
  const secondsPreview = parseDuration(duration);

  const secondaryMetric = (() => {
    if (!secondsPreview || !distanceKmForPreview) return "–";
    if (sport === "run")  return fmtPaceMinPerKm(secondsPreview, distanceKmForPreview);
    if (sport === "cycle")return fmtSpeedKph(secondsPreview, distanceKmForPreview);
    return fmtSwimPacePer100m(secondsPreview, distanceKmForPreview);
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const seconds = parseDuration(duration);
    const distNum = Number(distance);
    if (!Number.isFinite(distNum) || distNum <= 0) {
      return setError(sport === "swim" ? "Distanse må være > 0 (meter)" : "Distanse må være > 0 (km)");
    }
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return setError('Varighet må være sekunder eller "MM:SS"');
    }

    try {
      setLoading(true);
      const distanceKm = sport === "swim" ? distNum / 1000 : distNum;
      const payload = {
        sport,
        distance: distanceKm,                 // lagres alltid i KM
        duration: seconds,                    // sekunder
        date: new Date(date).toISOString(),   // valgt/dagens dato
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      };
      const res = await api.post("/activities", payload);
      setLoading(false);
      onSaved?.(res.data);
      setDistance("");
      setDuration("25:00");
      setTitle("");
      setComment("");
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.error || "Kunne ikke lagre aktiviteten");
    }
  };

  return (
    <form onSubmit={handleSubmit}
      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, width:"100%" }}
    >
      {/* Sport-segment – sentrert */}
      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
        <Segment onClick={() => setSport("run")}   active={sport==="run"}  label="Løping" />
        <Segment onClick={() => setSport("cycle")} active={sport==="cycle"} label="Sykling" />
        <Segment onClick={() => setSport("swim")}  active={sport==="swim"} label="Svømming" />
      </div>

      {error && (
        <div style={{ borderRadius:10, border:"1px solid #fecaca", background:"#fef2f2", padding:"8px 12px", fontSize:14, color:"#b91c1c", width:"100%", maxWidth:420 }}>
          {error}
        </div>
      )}

      <LabeledInput
        label="Navn på økt (valgfri)"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <LabeledInput
        label={sport === "swim" ? "Distanse (meter)" : "Distanse (km)"}
        type="number"
        step={sport === "swim" ? "25" : "0.01"}
        value={distance}
        onChange={(e) => setDistance(e.target.value)}
      />

      <LabeledInput
        label='Varighet (sek eller "MM:SS")'
        type="text"
        value={duration}
        placeholder=""
        onChange={(e) => setDuration(e.target.value)}
      />

      {/* Preview av sekundær-metrikk */}
      <div style={{ width:"100%", maxWidth:420, color:"#475569", fontSize:14 }}>
        {sport === "run"  && <>Pace: <strong>{secondaryMetric}</strong></>}
        {sport === "cycle"&& <>Snittfart: <strong>{secondaryMetric}</strong></>}
        {sport === "swim" && <>Tempo: <strong>{secondaryMetric}</strong></>}
        {secondsPreview && distanceKmForPreview ? <> · Varighet: {fmtDuration(secondsPreview)}</> : null}
      </div>

      <LabeledInput
        label="Dato"
        type="datetime-local"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div style={{ width:"100%", maxWidth:420, display:"flex", flexDirection:"column", gap:6 }}>
        <span style={{ fontSize:14, color:"#334155" }}>Kommentar (valgfri)</span>
        <textarea rows={3} value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="Hvordan føltes økten?"
          style={{ borderRadius:12, border:"1px solid #cbd5e1", padding:"10px 12px", fontSize:14, outline:"none" }} />
      </div>

      <button type="submit" disabled={loading}
        style={{ display:"inline-flex", alignItems:"center", gap:8, borderRadius:12, border:"1px solid #cbd5e1",
                 background:"#0f172a", color:"#fff", padding:"10px 16px", boxShadow:"0 1px 2px rgba(0,0,0,0.06)", opacity:loading?0.6:1 }}>
        <PlusCircle size={16} /> {loading ? "Lagrer…" : "Legg til aktivitet"}
      </button>
    </form>
  );
};

const Segment = ({ active, label, onClick }) => (
  <button type="button" onClick={onClick} aria-pressed={active}
    style={{ padding:"8px 12px", borderRadius:9999, border:`1px solid ${active ? "#0f172a" : "#cbd5e1"}`,
             background: active ? "#0f172a" : "transparent", color: active ? "#fff" : "#0f172a", cursor:"pointer", minWidth:96 }}>
    {label}
  </button>
);

const LabeledInput = ({ label, ...props }) => (
  <label style={{ width:"100%", maxWidth:420, display:"flex", flexDirection:"column", gap:6 }}>
    <span style={{ fontSize:14, color:"#334155" }}>{label}</span>
    <input {...props}
      style={{ borderRadius:12, border:"1px solid #cbd5e1", padding:"8px 12px", fontSize:14, outline:"none" }}
      required={props.type !== "datetime-local" ? true : props.required}
    />
  </label>
);

/* ================================
   Activities (Kalender + Ukesliste)
================================ */

const ActivitiesPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date()); // klikk i kalender
  const [openComments, setOpenComments] = useState(new Set()); // toggles per aktivitet-id

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await api.delete(`/activities/${id}`);
      setActivities((prev) => prev.filter((a) => a._id !== id));
      setOpenComments((prev) => { const n = new Set(prev); n.delete(id); return n; });
      setConfirmDeleteId(null);
    } catch (e) {
      alert("Sletting feilet");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/activities");
        setActivities(res.data || []);
      } catch(e) {
        // ignorer
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Map av dag -> sports som skjedde den dagen (for prikker i kalenderen)
  const daySports = useMemo(() => {
    const map = new Map();
    for (const a of activities) {
      const key = dateKey(a.date);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(a.sport);
    }
    return map;
  }, [activities]);

  // Uke-aktiviteter: uken som inneholder selectedDate
  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const weekDays = [...Array(7)].map((_,i) => addDays(weekStart, i));
  const weekActivitiesByDay = useMemo(() => {
    const m = new Map();
    for (const d of weekDays) m.set(dateKey(d), []);
    for (const a of activities) {
      const k = dateKey(a.date);
      if (m.has(k)) m.get(k).push(a);
    }
    // sortér per dag etter tid (nyeste først)
    for (const k of m.keys()) m.get(k).sort((a,b)=>new Date(b.date)-new Date(a.date));
    return m;
  }, [activities, weekDays]);

  const toggleComment = (id) => {
    setOpenComments(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <BackLink />
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Aktiviteter</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Kalender (venstre) */}
        <CalendarMonth
          monthDate={monthDate}
          onPrev={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth()-1, 1))}
          onNext={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth()+1, 1))}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          daySports={daySports}
        />

        {/* Ukesliste (høyre) */}
        <div style={{ border:"1px solid #e2e8f0", borderRadius:16, background:"#fff", padding:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontWeight:700, color:"#0f172a" }}>
              Uke {formatWeekRangeLabel(weekStart)}
            </div>
            <div style={{ color:"#64748b", fontSize:12 }}>
              Klikk en dag i kalenderen for å bytte uke
            </div>
          </div>

          {loading && <div style={{ color:"#475569" }}>Laster…</div>}

          {!loading && (
            <div style={{ display:"grid", gap:12 }}>
              {weekDays.map((d) => {
                const k = dateKey(d);
                const items = weekActivitiesByDay.get(k) || [];
                return (
                  <div key={k} style={{
                    border:"1px solid #e2e8f0",
                    borderRadius:12,
                    padding:12,
                    background: isSameDay(d, selectedDate) ? "rgba(59,130,246,0.05)" : "#fff"
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8 }}>
                      <div style={{ fontWeight:600, color:"#0f172a" }}>
                        {d.toLocaleDateString("no-NO", { weekday:"long", day:"2-digit", month:"short" })}
                      </div>
                      <div style={{ color:"#64748b", fontSize:12 }}>
                        {items.length} økt{items.length === 1 ? "" : "er"}
                      </div>
                    </div>

                    {items.length === 0 ? (
                      <div style={{ color:"#94a3b8", fontSize:14 }}>Ingen økter denne dagen</div>
                    ) : (
                      <ul style={{ listStyle:"none", margin:0, padding:0, display:"grid", gap:8 }}>
                        {items.map((a) => (
                          <li key={a._id} style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 12px", background:"#fff" }}>
                            <button
                              onClick={() => toggleComment(a._id)}
                              style={{ width:"100%", textAlign:"left", background:"transparent", border:"none", padding:0, cursor:"pointer" }}
                              title="Vis/skjul kommentar"
                            >
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:8, color:"#0f172a", fontWeight:600 }}>
                                  <span
                                    style={{
                                      display:"inline-block",
                                      width:10, height:10, borderRadius:9999,
                                      background: SPORT_COLORS[a.sport] || "#94a3b8"
                                    }}
                                  />
                                  {SPORT_LABELS[a.sport] || "Aktivitet"}
                                </div>
                                <div style={{ color:"#334155", fontSize:14 }}>
                                  {/* type, distanse, tid, pace/speed (+ tittel om finnes) */}
                                  {Number(a.distance).toFixed(2)} km · {fmtDuration(Number(a.duration))} · {
                                    a.sport === "cycle"
                                      ? fmtSpeedKph(Number(a.duration), Number(a.distance))
                                      : a.sport === "swim"
                                        ? fmtSwimPacePer100m(Number(a.duration), Number(a.distance))
                                        : fmtPaceMinPerKm(Number(a.duration), Number(a.distance))
                                  }
                                  {a.title ? <> · «{a.title}»</> : null}
                                </div>
                              </div>
                            </button>
                            {openComments.has(a._id) && (
                              <div style={{ marginTop:8, borderTop:"1px dashed #e2e8f0", paddingTop:8 }}>
                                <div style={{ color:"#475569", fontSize:14 }}>
                                  {a.comment ? a.comment : <span style={{ color:"#94a3b8" }}>Ingen kommentar</span>}
                                </div>

                                {/* Actions */}
                                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                                  {confirmDeleteId === a._id ? (
                                    <>
                                      <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        style={{ border:"1px solid #cbd5e1", borderRadius:8, padding:"6px 10px", background:"#fff", cursor:"pointer" }}
                                      >
                                        Avbryt
                                      </button>
                                      <button
                                        onClick={() => handleDelete(a._id)}
                                        disabled={deletingId === a._id}
                                        style={{
                                        border:"1px solid #fecaca",
                                        borderRadius:8,
                                        padding:"6px 10px",
                                        background:"#ef4444",
                                        color:"#fff",
                                        cursor: deletingId === a._id ? "default" : "pointer",
                                        opacity: deletingId === a._id ? 0.7 : 1
                                        }}
                                        title="Bekreft sletting"
                                      >
                                        {deletingId === a._id ? "Sletter…" : "Bekreft sletting"}
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteId(a._id)}
                                      style={{ border:"1px solid #cbd5e1", borderRadius:8, padding:"6px 10px", background:"#fff", cursor:"pointer", color:"#b91c1c" }}
                                      title="Slett denne økten"
                                    >
                                      Slett
                                    </button>
                                  )}
                            </div>
                          </div>
                        )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CalendarMonth = ({ monthDate, onPrev, onNext, selectedDate, onSelectDate, daySports }) => {
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();
  const grid = buildMonthGrid(y, m);
  const monthLabel = monthDate.toLocaleDateString("no-NO", { month:"long", year:"numeric" });

  const isInMonth = (d) => d.getMonth() === m;
  const today = new Date();
  const weekdayLabels = ["ma","ti","on","to","fr","lø","sø"];

  return (
    <div style={{ border:"1px solid #e2e8f0", borderRadius:16, background:"#fff", padding:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <button onClick={onPrev} style={navBtnStyle} aria-label="Forrige måned">‹</button>
        <div style={{ fontWeight:700, color:"#0f172a", textTransform:"capitalize" }}>{monthLabel}</div>
        <button onClick={onNext} style={navBtnStyle} aria-label="Neste måned">›</button>
      </div>

      {/* Ukedager */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:6, marginBottom:6 }}>
        {weekdayLabels.map((w) => (
          <div key={w} style={{ color:"#64748b", fontSize:12, textAlign:"center" }}>{w}</div>
        ))}
      </div>

      {/* Dager */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:6 }}>
        {grid.map((d, idx) => {
          const k = dateKey(d);
          const sports = daySports.get(k) || new Set();
          const selected = isSameDay(d, selectedDate);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={idx}
              onClick={() => onSelectDate(d)}
              style={{
                border:"1px solid #e2e8f0",
                borderRadius:10,
                padding:"8px 6px",
                height:64,
                background: selected ? "rgba(59,130,246,0.08)" : "#fff",
                opacity: isInMonth(d) ? 1 : 0.5,
                cursor:"pointer"
              }}
              title={d.toLocaleDateString("no-NO")}
            >
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontWeight:600, color:"#0f172a" }}>{d.getDate()}</div>
                {isToday && <div style={{ fontSize:10, color:"#3b82f6" }}>i dag</div>}
              </div>

              {/* prikker for sport(er) */}
              <div style={{ marginTop:6, display:"flex", gap:6 }}>
                {[...sports].slice(0,3).map((s) => (
                  <span key={s} style={{
                    display:"inline-block", width:10, height:10, borderRadius:9999,
                    background: SPORT_COLORS[s] || "#94a3b8",
                    border:"1px solid rgba(0,0,0,0.1)"
                  }} />
                ))}
                {sports.size > 3 && (
                  <span style={{ fontSize:10, color:"#64748b" }}>+{sports.size-3}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const navBtnStyle = {
  border:"1px solid #cbd5e1",
  borderRadius:8,
  padding:"4px 8px",
  background:"transparent",
  cursor:"pointer",
  color:"#0f172a"
};

/* ================================
   Achievements (3 rader)
================================ */

const AchievementsPage = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    api.get("/activities").then((r) => setActivities(r.data || [])).catch(() => {});
  }, []);

  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const W = 7 * 24 * 3600 * 1000;
  const weeksElapsedYTD = Math.max(1, (Date.now() - startOfYear.getTime()) / W);

  const statsFor = (sport) => {
    const all = activities.filter(a => a.sport === sport);
    const ytd = all.filter(a => new Date(a.date) >= startOfYear);

    const longest = all.reduce((best, a) => (a.distance > (best?.distance || 0) ? a : best), null);
    const totalKmYTD = ytd.reduce((s, a) => s + (Number(a.distance) || 0), 0);
    const totalSecYTD = ytd.reduce((s, a) => s + (Number(a.duration) || 0), 0);
    const hoursYTD = totalSecYTD / 3600;
    const avgPerWeek = ytd.length / weeksElapsedYTD;

    return {
      longestKm: longest ? Number(longest.distance) : null,
      totalKmYTD,
      hoursYTD,
      avgPerWeek,
    };
  };

  const run = statsFor("run");
  const cycle = statsFor("cycle");
  const swim = statsFor("swim");

  const fmtKm = (v) => (v == null ? "–" : `${v.toFixed(1)} km`);
  const fmtHours = (h) => (h == null ? "–" : `${h.toFixed(1)} t`);
  const fmtCountPerWeek = (v) => (v == null ? "–" : `${v.toFixed(2)}/uke`);

  const Col = ({ title, items }) => (
    <div style={{
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      background: "#fff",
      padding: 16,
      width: "100%",
      maxWidth: 600,
      textAlign: "left",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }}>
      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 18, marginBottom: 10 }}>{title}</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
        {items.map(([label, value], i) => (
          <li key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span style={{ color: "#475569" }}>{label}</span>
            <span style={{ color: "#0f172a", fontWeight: 600 }}>{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <BackLink />
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Prestasjoner</h2>

      {/* 3 rader (vertikalt), sentrert med litt luft mellom */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, justifyItems: "center", alignItems: "start" }}>
        <Col
          title="Løping"
          items={[
            ["Lengste løpetur", fmtKm(run.longestKm)],
            ["Km løpt i år", fmtKm(run.totalKmYTD)],
            ["Timer løpt i år", fmtHours(run.hoursYTD)],
            ["Snitt løpeturer/uke", fmtCountPerWeek(run.avgPerWeek)],
          ]}
        />
        <Col
          title="Sykling"
          items={[
            ["Lengste tur", fmtKm(cycle.longestKm)],
            ["Km syklet i år", fmtKm(cycle.totalKmYTD)],
            ["Timer syklet i år", fmtHours(cycle.hoursYTD)],
            ["Snitt sykkeløkter/uke", fmtCountPerWeek(cycle.avgPerWeek)],
          ]}
        />
        <Col
          title="Svømming"
          items={[
            ["Lengste svømmetur", fmtKm(swim.longestKm)],
            ["Timer svømt i år", fmtHours(swim.hoursYTD)],
            ["Km svømt i år", fmtKm(swim.totalKmYTD)],
            ["Snitt svømmeøkter/uke", fmtCountPerWeek(swim.avgPerWeek)],
          ]}
        />
      </div>
    </div>
  );
};

/* ================================
   Blocks (placeholder)
================================ */

const BlocksPage = () => (
  <div style={{ maxWidth: 800 }}>
    <BackLink />
    <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Treningsblokker</h2>
    <p style={{ color: "#475569", marginBottom: 16 }}>Planlegg perioder (f.eks. Base, Bygging, Topping). Kommer snart – enkel mock under.</p>

    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
      {["Base 4 uker", "Bygging 6 uker", "Topping 2 uker", "Konkurranse"].map((t, i) => (
        <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff", padding: 12 }}>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>{t}</div>
          <div style={{ fontSize: 14, color: "#64748b" }}>Klikk for detaljer (kan kobles til egen CRUD senere).</div>
        </div>
      ))}
    </div>
  </div>
);

/* ================================
   App (Router)
================================ */

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddActivityPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/blocks" element={<BlocksPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}

const NotFound = () => (
  <div>
    <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Fant ikke siden</h2>
    <p style={{ color: "#475569" }}>Lenken kan være feil. Gå tilbake til <Link style={{ textDecoration: "underline" }} to="/">forsiden</Link>.</p>
  </div>
);
