import React, { useMemo, useState } from "react";
import "./Calendar.css";

// Simple month calendar with day badges and event tooltips.
// Props: events: Array<{ title, date: number|Date, category?, address? }>
export default function Calendar({ events = [], onSelectEvent }) {
  const [viewDate, setViewDate] = useState(new Date());

  const { year, month } = useMemo(() => ({
    year: viewDate.getFullYear(),
    month: viewDate.getMonth(),
  }), [viewDate]);

  const monthStart = useMemo(() => new Date(year, month, 1), [year, month]);
  const monthEnd = useMemo(() => new Date(year, month + 1, 0), [year, month]);

  // Start grid from Sunday of the first week containing the 1st
  const gridStart = useMemo(() => {
    const d = new Date(monthStart);
    const day = d.getDay(); // 0-6 Sun-Sat
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [monthStart]);

  const days = useMemo(() => {
    // 6 weeks x 7 days = 42 cells
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [gridStart]);

  const normalizeDateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const inputEvents = useMemo(() => {
    return (events || []).map((e, idx) => {
      const date = e.date instanceof Date ? e.date : new Date(Number(e.date));
      return {
        id: e.id ?? `ev-${idx}`,
        title: e.title || e.name || "Event",
        date,
        category: e.category || "Other",
        address: e.address,
      };
    });
  }, [events]);

  // Generate tasteful sample events for the visible month if too sparse
  const sampleEvents = useMemo(() => {
    const samples = [];
    const categories = ["Music", "Sports", "Conference", "Arts", "Festival", "Workshop"];
    const names = [
      "Sunrise Sessions", "Tech Talks", "Art Pop-Up", "City Marathon",
      "Food Fest", "Design Sprint", "Crypto Meetup", "Indie Night", "Startup Pitch", "Coding Jam"
    ];
    // Count how many real events fall within the current month
    const inMonthReal = inputEvents.filter(e => e.date >= monthStart && e.date <= monthEnd);
    const need = Math.max(0, 7 - inMonthReal.length);
    for (let i = 0; i < need; i++) {
      const dayOffset = 2 + i * 3; // spread across the month
      const d = new Date(year, month, Math.min(1 + dayOffset, monthEnd.getDate() - (i % 2)));
      samples.push({
        id: `sample-${year}-${month}-${i}`,
        title: names[i % names.length],
        date: d,
        category: categories[i % categories.length],
        address: null,
        _sample: true,
      });
    }
    return samples;
  }, [inputEvents, monthStart, monthEnd, year, month]);

  const monthEvents = useMemo(() => {
    const all = [...inputEvents, ...sampleEvents];
    const map = new Map();
    for (const e of all) {
      if (e.date < gridStart) continue;
      if (e.date > days[days.length - 1]) continue;
      const key = normalizeDateKey(e.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return map;
  }, [inputEvents, sampleEvents, gridStart, days]);

  const isSameMonth = (d) => d.getMonth() === month;

  const goPrev = () => setViewDate(new Date(year, month - 1, 1));
  const goNext = () => setViewDate(new Date(year, month + 1, 1));

  const monthName = viewDate.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <section className="calendar">
      <div className="calendar-header">
        <button className="cal-nav" onClick={goPrev} aria-label="Previous month">‹</button>
        <h3 className="calendar-title">{monthName}</h3>
        <button className="cal-nav" onClick={goNext} aria-label="Next month">›</button>
      </div>
      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="cal-dow">{d}</div>
        ))}
        {days.map((d) => {
          const key = normalizeDateKey(d);
          const list = monthEvents.get(key) || [];
          return (
            <div key={key} className={`cal-cell ${isSameMonth(d) ? "" : "cal-out"}`}>
              <div className="cal-daynum">{d.getDate()}</div>
              {list.length > 0 && (
                <div className="cal-badges">
                  {list.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={`cal-badge ${e._sample ? "sample" : "real"}`}
                      title={`${e.title} • ${e.category}`}
                      onClick={() => e.address && onSelectEvent && onSelectEvent(e.address)}
                    >
                      {e.title}
                    </span>
                  ))}
                  {list.length > 3 && <span className="cal-more">+{list.length - 3} more</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
