import React, { useMemo } from "react";

const dateKey = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const da = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};

const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt; };
const isSameDay = (a, b) => dateKey(a) === dateKey(b);

const buildMonthGrid = (year, monthIdx) => {
  const first = new Date(year, monthIdx, 1);
  const firstDow = (first.getDay() + 6) % 7; // 0=Mon
  const start = addDays(first, -firstDow);
  const days = [];
  for (let i = 0; i < 42; i++) days.push(addDays(start, i));
  return days;
};

const navBtnStyle = {
  border:"1px solid #cbd5e1",
  borderRadius:8,
  padding:"4px 8px",
  background:"transparent",
  cursor:"pointer",
  color:"#0f172a"
};

/**
 * markers: Map<YYYY-MM-DD, Array<{ label?: string, color?: string }>>
 * - for Activities bruker du dots (color)
 * - for Plan kan du bruke label (f.eks økt-type) og evt color
 */
export default function CalendarMonth({
  monthDate,
  onPrev,
  onNext,
  selectedDate,
  onSelectDate,
  markers,
  maxMarkers = 3,
}) {
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();
  const grid = useMemo(() => buildMonthGrid(y, m), [y, m]);
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

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:6, marginBottom:6 }}>
        {weekdayLabels.map((w) => (
          <div key={w} style={{ color:"#64748b", fontSize:12, textAlign:"center" }}>{w}</div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:6 }}>
        {grid.map((d, idx) => {
          const k = dateKey(d);
          const items = markers?.get(k) || [];
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
                height:76,
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

              {/* markers: enten dots eller små labels */}
              <div style={{ marginTop:6, display:"grid", gap:4 }}>
                {items.slice(0, maxMarkers).map((it, i) => (
                  it.label ? (
                    <div
                      key={i}
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 9999,
                        border: "1px solid rgba(0,0,0,0.12)",
                        background: "rgba(0,0,0,0.03)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={it.label}
                    >
                      {it.label}
                    </div>
                  ) : (
                    <span key={i} style={{
                      display:"inline-block", width:10, height:10, borderRadius:9999,
                      background: it.color || "#94a3b8",
                      border:"1px solid rgba(0,0,0,0.1)"
                    }} />
                  )
                ))}
                {items.length > maxMarkers && (
                  <div style={{ fontSize:10, color:"#64748b" }}>+{items.length - maxMarkers}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}