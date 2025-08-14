import React, { useState } from "react";
import axios from "axios";

// Hjelper: "MM:SS" eller sekunder -> sekunder (Number)
const parseDuration = (val) => {
  if (val == null || val === "") return null;
  if (/^\d+$/.test(val)) return Number(val);           // f.eks. "1500"
  const m = val.match(/^(\d+):(\d{1,2})$/);            // f.eks. "25:00"
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return NaN;
};

// Hjelper: default dagens dato/tid for <input type="datetime-local">
const formatLocalDatetime = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function ActivityForm({ onCreated }) {
  const [sport, setSport] = useState("run");               // run | cycle | swim
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");            // sek eller MM:SS
  const [date, setDate] = useState(formatLocalDatetime()); // dagens dato
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const seconds = parseDuration(duration);
    if (!Number.isFinite(Number(distance)) || Number(distance) <= 0) {
      return setError("Distanse må være > 0");
    }
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return setError('Varighet må være sekunder eller "MM:SS"');
    }

    try {
      setLoading(true);
      const payload = {
        sport,
        distance: Number(distance),
        duration: seconds,
        date: new Date(date).toISOString(),
        comment: comment.trim() || undefined,
      };
      const res = await axios.post("/api/activities", payload);
      setLoading(false);
      setDistance("");
      setDuration("");
      setComment("");
      // Oppdater liste i parent hvis sendt inn som prop
      onCreated?.(res.data);
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.error || "Kunne ikke lagre aktiviteten");
      console.error("Error adding activity:", err);
    }
  };

  return (
    <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12, alignItems:"center", maxWidth:480 }}>
      {/* Sport-segment sentrert */}
      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
        {[
          { key:"run",   label:"Løping"   },
          { key:"cycle", label:"Sykling"  },
          { key:"swim",  label:"Svømming" }
        ].map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setSport(opt.key)}
            aria-pressed={sport===opt.key}
            style={{
              padding:"8px 12px",
              borderRadius:9999,
              border:`1px solid ${sport===opt.key ? "#0f172a" : "#cbd5e1"}`,
              background: sport===opt.key ? "#0f172a" : "transparent",
              color: sport===opt.key ? "#fff" : "#0f172a",
              cursor:"pointer",
              minWidth:96
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ width:"100%", border:"1px solid #fecaca", background:"#fef2f2", color:"#b91c1c", borderRadius:10, padding:"8px 12px", fontSize:14 }}>
          {error}
        </div>
      )}

      <label style={{ width:"100%", display:"flex", flexDirection:"column", gap:6 }}>
        <span style={{ fontSize:14, color:"#334155" }}>Distanse (km)</span>
        <input type="number" step="0.01" value={distance} onChange={(e)=>setDistance(e.target.value)}
               required style={{ border:"1px solid #cbd5e1", borderRadius:12, padding:"8px 12px", fontSize:14 }} />
      </label>

      <label style={{ width:"100%", display:"flex", flexDirection:"column", gap:6 }}>
        <span style={{ fontSize:14, color:"#334155" }}>Varighet (sek eller MM:SS)</span>
        <input type="text" value={duration} onChange={(e)=>setDuration(e.target.value)} placeholder="25:00"
               required style={{ border:"1px solid #cbd5e1", borderRadius:12, padding:"8px 12px", fontSize:14 }} />
      </label>

      <label style={{ width:"100%", display:"flex", flexDirection:"column", gap:6 }}>
        <span style={{ fontSize:14, color:"#334155" }}>Dato</span>
        <input type="datetime-local" value={date} onChange={(e)=>setDate(e.target.value)}
               style={{ border:"1px solid #cbd5e1", borderRadius:12, padding:"8px 12px", fontSize:14 }} />
      </label>

      <label style={{ width:"100%", display:"flex", flexDirection:"column", gap:6 }}>
        <span style={{ fontSize:14, color:"#334155" }}>Kommentar (valgfri)</span>
        <textarea rows={3} value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="Hvordan føltes økten?"
                  style={{ border:"1px solid #cbd5e1", borderRadius:12, padding:"10px 12px", fontSize:14 }} />
      </label>

      <button type="submit" disabled={loading}
              style={{ display:"inline-flex", alignItems:"center", gap:8, border:"1px solid #cbd5e1",
                       background:"#0f172a", color:"#fff", padding:"10px 16px", borderRadius:12 }}>
        {loading ? "Lagrer…" : "Legg til aktivitet"}
      </button>
    </form>
  );
}
