import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const SPORT_LABELS = { run: "Løping", cycle: "Sykling", swim: "Svømming" };

const fmtDuration = (seconds) => {
  if (!Number.isFinite(Number(seconds))) return "–";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const fmtPace = (seconds, km) => {
  if (!seconds || !km) return "–";
  const pace = seconds / km;
  const m = Math.floor(pace / 60);
  const s = Math.round(pace % 60).toString().padStart(2, "0");
  return `${m}:${s} min/km`;
};

export default function ActivityList() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/activities");
      setActivities(res.data || []);
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/activities/${id}`);
      setActivities((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error("Feil ved sletting:", err);
    }
  };

  const totals = useMemo(() => {
    const km = activities.reduce((a, r) => a + (Number(r.distance) || 0), 0);
    const sec = activities.reduce((a, r) => a + (Number(r.duration) || 0), 0);
    return { km, sec };
  }, [activities]);

  return (
    <div>
      <h2>Aktivitetshistorikk</h2>
      <div style={{ color:"#64748b", fontSize:14, marginBottom:8 }}>
        Totalt <strong>{totals.km.toFixed(2)} km</strong> · {fmtDuration(totals.sec)}
      </div>

      {loading && <p>Laster…</p>}
      {!loading && activities.length === 0 && <p>Ingen aktiviteter ennå.</p>}

      <ul style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {activities.map((a) => (
          <li key={a._id} style={{ border:"1px solid #e2e8f0", borderRadius:12, padding:"12px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, fontWeight:600 }}>
                  {Number(a.distance).toFixed(2)} km
                  <span style={{ fontSize:12, padding:"2px 8px", border:"1px solid #cbd5e1", borderRadius:9999, color:"#334155" }}>
                    {SPORT_LABELS[a.sport] || "Løping"}
                  </span>
                </div>
                <div style={{ color:"#475569", fontSize:14 }}>
                  {fmtDuration(Number(a.duration))} · {fmtPace(Number(a.duration), Number(a.distance))}
                </div>
                <div style={{ color:"#64748b", fontSize:12 }}>
                  {new Date(a.date).toLocaleString("no-NO")}
                </div>
                {a.comment && (
                  <div style={{ color:"#334155", fontSize:13, marginTop:6 }}>
                    {a.comment}
                  </div>
                )}
              </div>

              <button onClick={() => handleDelete(a._id)}
                      style={{ border:"1px solid #cbd5e1", borderRadius:8, padding:"6px 10px", background:"transparent", cursor:"pointer" }}>
                Slett
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
