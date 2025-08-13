import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Trophy, List, PlusCircle, Layers, CalendarDays, Clock, MapPin, Trash2, ArrowLeft } from "lucide-react";

// ---------- Utils ----------
const fmtPace = (seconds, km) => {
  if (!seconds || !km) return "–";
  const pace = seconds / km; // sec per km
  const m = Math.floor(pace / 60);
  const s = Math.round(pace % 60).toString().padStart(2, "0");
  return `${m}:${s} min/km`;
};

const fmtDuration = (seconds) => {
  if (seconds == null) return "–";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const parseDuration = (val) => {
  if (val == null || val === "") return null;
  if (/^\d+$/.test(val)) return Number(val); // already seconds
  const m = val.match(/^(\d+):(\d{1,2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return NaN;
};

const api = axios.create({ baseURL: "/api" });

// ---------- Layout ----------
const Shell = ({ children }) => {
  const { pathname } = useLocation();
  const overlay = pathname === "/"; // På forsiden vil vi ha menyen over bildet

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f0f9ff,white,#f5f3ff)" }}>
      <header
        style={{
          position: overlay ? "absolute" : "sticky",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: overlay ? "transparent" : "rgba(255,255,255,0.7)",
          borderBottom: overlay ? "none" : "1px solid rgba(203,213,225,0.6)",
          backdropFilter: overlay ? "none" : "saturate(180%) blur(6px)",
        }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: overlay ? "#fff" : "#0f172a" }}>
            
            <span style={{ fontWeight: 600 }}>kilometers.</span>
          </Link>
          <nav style={{ display: "flex", gap: 8 }}>
            <Nav to="/add" label="Ny økt" overlay={overlay} icon={<PlusCircle size={16} />} />
            <Nav to="/runs" label="Løpeturer" overlay={overlay} icon={<List size={16} />} />
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

// ---------- Hook: viewport height (for 100% screen fill on mobile/browser UI) ----------
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
  return h; // px number or null on SSR
};

// ---------- Home (full-screen background hero, no Tailwind) ----------
const FRONTPAGE_IMAGE_URL = "/frontpage2.jpg"; 

const Home = () => {
  const vh = useViewportHeight();
  return (
    <div>
      {/* Full-bleed seksjon som dekker hele skjermen */}
      <section
        style={{ position: 'relative', width: '100vw', left: '50%', transform: 'translateX(-50%)' }}
      >
        <div style={{ position: 'relative', height: vh ? `${vh}px` : '100vh' }}>
          {/* Bakgrunnsbilde fyller hele flaten */}
          <img
            src={FRONTPAGE_IMAGE_URL}
            alt="kilometers. frontpage"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Mørk overlay for kontrast */}
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(0,0,0,0.40)' }} />
          {/* Tekst foran bildet */}
          <div style={{ position: 'absolute', left: '50%', bottom: '32vh', transform: 'translateX(-50%)', color: '#fff', textAlign: 'center', textShadow: '0 1px 2px rgba(11, 11, 11, 0.4)' }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#e3eb09' }}>kilometers.</h1>
          </div>
          <div style={{ position: 'absolute', left: 16, bottom: 12, color: '#9ca3af', fontSize: 12, textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)' }}>© {new Date().getFullYear()} kilometers.</div>
        </div>
      </section>
    </div>
  );
};


// ---------- Add Run ----------
const AddRunPage = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-xl">
      <BackLink />
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Legg til ny økt</h2>
      <RunForm onSaved={() => navigate("/runs")} />
    </div>
  );
};

const BackLink = () => (
  <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6">
    <ArrowLeft className="w-4 h-4" /> Til forsiden
  </Link>
);

const RunForm = ({ onSaved }) => {
  const [distance, setDistance] = useState(5);
  const [duration, setDuration] = useState("25:00");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const seconds = parseDuration(duration);
    if (!Number.isFinite(Number(distance)) || Number(distance) <= 0) {
      setError("Distanse må være > 0");
      return;
    }
    if (!Number.isFinite(seconds) || seconds <= 0) {
      setError("Varighet må være sekunder eller MM:SS");
      return;
    }

    try {
      setLoading(true);
      const payload = { distance: Number(distance), duration: seconds };
      if (date) payload.date = new Date(date).toISOString();
      const res = await api.post("/runs", payload);
      setLoading(false);
      if (onSaved) onSaved(res.data);
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.error || "Kunne ikke lagre økten");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-700">Distanse (km)</span>
          <input
            type="number"
            step="0.01"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-700">Varighet (sek eller MM:SS)</span>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="25:00"
            required
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-700">Dato (valgfri)</span>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-900 text-white px-4 py-2 shadow-sm hover:opacity-95 disabled:opacity-50"
      >
        <PlusCircle className="w-4 h-4" /> {loading ? "Lagrer…" : "Legg til økt"}
      </button>
    </form>
  );
};

// ---------- Confirm Button (no-browser confirm to satisfy ESLint) ----------
const ConfirmButton = ({ onConfirm }) => {
  const [ask, setAsk] = useState(false);
  return (
    <div className="flex items-center gap-2">
      {!ask ? (
        <button
          onClick={() => setAsk(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
          title="Slett"
        >
          <Trash2 className="w-4 h-4" /> Slett
        </button>
      ) : (
        <>
          <button
            onClick={() => setAsk(false)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
          >
            Avbryt
          </button>
          <button
            onClick={() => { setAsk(false); onConfirm(); }}
            className="rounded-lg border border-red-300 bg-red-600 text-white px-3 py-1.5 hover:opacity-90"
          >
            Bekreft
          </button>
        </>
      )}
    </div>
  );
};

// ---------- Runs List ----------
const RunsPage = () => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/runs");
      setRuns(res.data || []);
      setLoading(false);
    } catch (err) {
      setError("Kunne ikke hente økter");
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id) => {
    try {
      await api.delete(`/runs/${id}`);
      setRuns((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      alert("Sletting feilet");
    }
  };

  const totals = useMemo(() => {
    const km = runs.reduce((a, r) => a + (Number(r.distance) || 0), 0);
    const sec = runs.reduce((a, r) => a + (Number(r.duration) || 0), 0);
    return { km, sec };
  }, [runs]);

  return (
    <div>
      <BackLink />
      <div className="flex items-end justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Løpeturer</h2>
        <div className="text-sm text-slate-600">
          Totalt <span className="font-semibold">{totals.km.toFixed(2)} km</span> · {fmtDuration(totals.sec)}
        </div>
      </div>

      {loading && <div className="text-slate-600">Laster…</div>}
      {error && <div className="text-red-600">{error}</div>}

      <ul className="space-y-3">
        {runs.map((r) => (
          <li key={r._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-900 font-medium">
                  <MapPin className="w-4 h-4 text-slate-500" /> {Number(r.distance).toFixed(2)} km
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Clock className="w-4 h-4" /> {fmtDuration(Number(r.duration))} · {fmtPace(Number(r.duration), Number(r.distance))}
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <CalendarDays className="w-4 h-4" /> {new Date(r.date).toLocaleString("no-NO")}
                </div>
              </div>
              <ConfirmButton onConfirm={() => onDelete(r._id)} />
            </div>
          </li>
        ))}
      </ul>

      {!loading && runs.length === 0 && (
        <div className="text-slate-500">Ingen økter enda. <Link to="/add" className="underline">Legg til din første</Link>.</div>
      )}
    </div>
  );
};

// ---------- Blocks (placeholder) ----------
const BlocksPage = () => (
  <div className="max-w-2xl">
    <BackLink />
    <h2 className="text-2xl font-bold text-slate-900 mb-2">Treningsblokker</h2>
    <p className="text-slate-600 mb-6">Planlegg perioder (f.eks. Base, Bygging, Topping). Kommer snart – her er en enkel mock for struktur.</p>

    <div className="grid gap-4 sm:grid-cols-2">
      {["Base 4 uker", "Bygging 6 uker", "Topping 2 uker", "Konkurranse"].map((t, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="font-medium text-slate-900">{t}</div>
          <div className="text-sm text-slate-600">Klikk for detaljer (kan kobles til egen CRUD senere).</div>
        </div>
      ))}
    </div>
  </div>
);

// ---------- Achievements ----------
const AchievementsPage = () => {
  const [runs, setRuns] = useState([]);
  useEffect(() => {
    api.get("/runs").then((r) => setRuns(r.data || [])).catch(() => {});
  }, []);

  const longest = useMemo(() => runs.reduce((a, r) => (r.distance > (a?.distance || 0) ? r : a), null), [runs]);
  const fastestPace = useMemo(() => runs.reduce((a, r) => {
    const p = (r.duration || 0) / (r.distance || 1);
    if (!a) return { run: r, pace: p };
    return p < a.pace ? { run: r, pace: p } : a;
  }, null), [runs]);

  // Last 7 days total
  const last7Days = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 3600 * 1000;
    const km = runs.reduce((sum, r) => (new Date(r.date).getTime() >= weekAgo ? sum + Number(r.distance || 0) : sum), 0);
    return km;
  }, [runs]);

  return (
    <div className="max-w-2xl">
      <BackLink />
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Prestasjoner</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Lengste tur" value={longest ? `${Number(longest.distance).toFixed(2)} km` : "–"} hint={longest ? new Date(longest.date).toLocaleDateString("no-NO") : ""} />
        <StatCard title="Beste pace" value={fastestPace ? fmtPace(fastestPace.run.duration, fastestPace.run.distance) : "–"} hint={fastestPace ? `${Number(fastestPace.run.distance).toFixed(2)} km` : ""} />
        <StatCard title="Siste 7 dager" value={`${last7Days.toFixed(2)} km`} hint="Akkumulert volum" />
        <StatCard title="Antall økter" value={runs.length} hint="Totalt logget" />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, hint }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="text-sm text-slate-600">{title}</div>
    <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
    {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
  </div>
);

// ---------- App (Router) ----------
export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddRunPage />} />
          <Route path="/runs" element={<RunsPage />} />
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
    <h2 className="text-2xl font-bold text-slate-900 mb-2">Fant ikke siden</h2>
    <p className="text-slate-600">Lenken kan være feil. Gå tilbake til <Link className="underline" to="/">forsiden</Link>.</p>
  </div>
);
