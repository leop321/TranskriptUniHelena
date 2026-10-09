/**
 * calendar.js – Wochen- und Monatskalender mit Swipe-Unterstützung
 */

(function () {
  "use strict";

  // ── State ──────────────────────────────────────────────────────────────
  const state = {
    view: "week",          // "week" | "month"
    currentDate: new Date(),
    recordings: [],        // [{recorded_at, subject_color, subject_name, id, title}, ...]
    swipeStartX: null,
  };

  const DAY_NAMES_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const DAY_NAMES_FULL  = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
  const MONTH_NAMES = [
    "Januar","Februar","März","April","Mai","Juni",
    "Juli","August","September","Oktober","November","Dezember"
  ];

  // ── Hilfsfunktionen ────────────────────────────────────────────────────
  function getMondayOfWeek(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  function getRecordingsForDay(date) {
    return state.recordings.filter(r => {
      const d = new Date(r.recorded_at);
      return isSameDay(d, date);
    });
  }

  function formatHeaderTitle() {
    if (state.view === "week") {
      const monday = getMondayOfWeek(state.currentDate);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      const mName = MONTH_NAMES[monday.getMonth()];
      const sName = MONTH_NAMES[sunday.getMonth()];
      if (monday.getMonth() === sunday.getMonth()) {
        return `${monday.getDate()}. – ${sunday.getDate()}. ${mName} ${monday.getFullYear()}`;
      }
      return `${monday.getDate()}. ${mName} – ${sunday.getDate()}. ${sName} ${monday.getFullYear()}`;
    }
    return `${MONTH_NAMES[state.currentDate.getMonth()]} ${state.currentDate.getFullYear()}`;
  }

  // ── Rendern: Wochenansicht ─────────────────────────────────────────────
  function renderWeek() {
    const monday = getMondayOfWeek(state.currentDate);
    const today = new Date();
    const grid = document.getElementById("cal-grid");
    grid.innerHTML = "";

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const recs = getRecordingsForDay(d);

      const cell = document.createElement("div");
      cell.className = "week-day" + (isSameDay(d, today) ? " today" : "");
      cell.innerHTML = `
        <span class="week-day__label">${DAY_NAMES_SHORT[i]}</span>
        <span class="week-day__num">${d.getDate()}</span>
        <div class="dots">
          ${recs.map(r => `<span class="dot" style="background:${r.subject_color}" title="${r.subject_name}: ${r.title}"></span>`).join("")}
        </div>`;
      cell.addEventListener("click", () => openDayModal(d, recs));
      grid.appendChild(cell);
    }
    document.getElementById("cal-title").textContent = formatHeaderTitle();
  }

  // ── Rendern: Monatsansicht ─────────────────────────────────────────────
  function renderMonth() {
    const today = new Date();
    const year  = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const grid  = document.getElementById("cal-grid");
    grid.innerHTML = "";

    // Wochentag-Labels
    DAY_NAMES_SHORT.forEach(n => {
      const lbl = document.createElement("div");
      lbl.className = "month-day-label";
      lbl.textContent = n;
      grid.appendChild(lbl);
    });

    // Erster Tag des Monats
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Padding aus Vormonat
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      grid.appendChild(makeMonthCell(d, true));
    }
    // Aktueller Monat
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      grid.appendChild(makeMonthCell(d, false));
    }
    // Auffüllen bis 42 Zellen
    const total = startOffset + daysInMonth;
    const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      grid.appendChild(makeMonthCell(d, true));
    }

    document.getElementById("cal-title").textContent = formatHeaderTitle();
    grid.className = "month-grid";
  }

  function makeMonthCell(d, otherMonth) {
    const today = new Date();
    const recs  = getRecordingsForDay(d);
    const cell  = document.createElement("div");
    cell.className = "month-day" +
      (isSameDay(d, today) ? " today" : "") +
      (otherMonth ? " other-month" : "");
    cell.innerHTML = `
      <span class="month-day__num">${d.getDate()}</span>
      <div class="dots">
        ${recs.slice(0, 4).map(r => `<span class="dot" style="background:${r.subject_color}"></span>`).join("")}
      </div>`;
    cell.addEventListener("click", () => openDayModal(d, recs));
    return cell;
  }

  // ── Tag-Modal ──────────────────────────────────────────────────────────
  function openDayModal(date, recs) {
    const modal = document.getElementById("day-modal");
    const title = document.getElementById("day-modal-title");
    const list  = document.getElementById("day-modal-list");

    const wd = DAY_NAMES_FULL[(date.getDay() + 6) % 7];
    title.textContent = `${wd}, ${date.getDate()}. ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

    if (recs.length === 0) {
      list.innerHTML = `<p style="color:var(--text-muted);font-size:0.9rem;text-align:center;padding:1rem 0;">Keine Aufnahmen an diesem Tag.</p>`;
    } else {
      list.innerHTML = recs.map(r => `
        <div class="day-rec-item">
          <span class="dot" style="background:${r.subject_color};width:10px;height:10px;"></span>
          <div style="flex:1">
            <div style="font-size:0.9rem;font-weight:500">${r.title}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${r.subject_name}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="playAudio(${r.id}, '${r.title.replace(/'/g,"\\'")}')" title="Abspielen">▶</button>
        </div>`).join("");
    }
    modal.classList.remove("hidden");
  }

  // ── Navigation ─────────────────────────────────────────────────────────
  function navigate(direction) {
    // direction: -1 = zurück, +1 = vor
    if (state.view === "week") {
      state.currentDate.setDate(state.currentDate.getDate() + direction * 7);
    } else {
      state.currentDate.setMonth(state.currentDate.getMonth() + direction);
    }
    render();
  }

  function toggleView() {
    state.view = state.view === "week" ? "month" : "week";
    const grid = document.getElementById("cal-grid");
    grid.className = state.view === "week" ? "week-grid" : "month-grid";
    const toggle = document.getElementById("view-toggle-btn");
    if (toggle) toggle.textContent = state.view === "week" ? "Monatsansicht" : "Wochenansicht";
    render();
  }

  function render() {
    state.view === "week" ? renderWeek() : renderMonth();
  }

  // ── Daten laden ────────────────────────────────────────────────────────
  async function loadRecordings() {
    try {
      const res = await fetch("/api/recordings");
      state.recordings = await res.json();
      render();
    } catch (e) {
      console.error("Fehler beim Laden der Aufnahmen:", e);
    }
  }

  // ── Swipe-Gesten ───────────────────────────────────────────────────────
  function initSwipe(el) {
    el.addEventListener("touchstart", e => {
      state.swipeStartX = e.touches[0].clientX;
    }, { passive: true });
    el.addEventListener("touchend", e => {
      if (state.swipeStartX === null) return;
      const dx = e.changedTouches[0].clientX - state.swipeStartX;
      if (Math.abs(dx) > 50) navigate(dx < 0 ? 1 : -1);
      state.swipeStartX = null;
    }, { passive: true });
  }

  // ── Initialisierung ────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("cal-grid");
    if (!grid) return;

    // Buttons verdrahten
    document.getElementById("cal-prev")?.addEventListener("click", () => navigate(-1));
    document.getElementById("cal-next")?.addEventListener("click", () => navigate(1));
    document.getElementById("view-toggle-btn")?.addEventListener("click", toggleView);

    // Tag-Modal schließen
    document.getElementById("day-modal-close")?.addEventListener("click", () =>
      document.getElementById("day-modal").classList.add("hidden")
    );
    document.getElementById("day-modal")?.addEventListener("click", function(e) {
      if (e.target === this) this.classList.add("hidden");
    });

    // Swipe-Gesten initialisieren
    initSwipe(grid);

    // Grid initial auf week setzen
    grid.className = "week-grid";

    loadRecordings();
  });

  // Öffentliche API
  window.CalendarApp = { reload: loadRecordings, toggleView };

})();
