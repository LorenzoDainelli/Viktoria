/* Shift Hours — orchestrazione dell'interfaccia.
 *
 * Tre schermate in tutto: la settimana, le impostazioni, la scelta del tipo
 * di settimana. Nessuna navigazione, nessun concetto tecnico visibile.
 */

import {
  DAY_INITIALS,
  DAY_NAMES,
  formatDayMonth,
  formatDuration,
  formatHrs,
  formatTime,
  shiftMinutes,
  sundayOf,
  totalMinutes,
  workedDays,
} from "./week.js";

import {
  MAX_CUSTOM_TYPES,
  MAX_TYPE_NAME,
  allTypes,
  currentWeekStart,
  findType,
  loadCurrentWeek,
  loadSettings,
  newWeek,
  pushHistory,
  saveCurrentWeek,
  saveSettings,
} from "./storage.js";

import { createRangeSlider } from "./slider.js";
import { buildSummary, copyText } from "./summary.js";

/* Turno proposto quando apre un giorno nuovo: si sposta subito con lo slider. */
const DEFAULT_SHIFT = { start: 9 * 60, end: 17 * 60 };

const el = (id) => document.getElementById(id);

let settings = loadSettings();
let week;
let type;
let openDay = null;
let slider = null;

/* ── Avvio ────────────────────────────────────────────────────────── */

function start() {
  const thisWeek = currentWeekStart();
  const stored = loadCurrentWeek();

  if (!stored) {
    week = newWeek(thisWeek, findType(settings, settings.lastTypeId));
  } else if (stored.weekStart !== thisWeek) {
    // Settimana nuova: quella vecchia va nello storico, mai persa in silenzio.
    if (Object.keys(stored.days).length > 0) {
      pushHistory(stored);
      toast(`Week ending ${formatDayMonth(sundayOf(stored.weekStart))} saved to history`);
    }
    week = newWeek(thisWeek, findType(settings, stored.typeId));
  } else {
    week = stored;
  }

  applyType(findType(settings, week.typeId), { save: false });
  saveCurrentWeek(week);
  bindEvents();
  render();
  registerServiceWorker();
}

/* ── Stato ────────────────────────────────────────────────────────── */

function applyType(nextType, { save = true } = {}) {
  type = nextType;
  week.typeId = type.id;
  week.typeName = type.name;
  if (save) saveCurrentWeek(week);
}

function persist() {
  saveCurrentWeek(week);
}

function todayNumber() {
  return ((new Date().getDay() + 6) % 7) + 1;
}

function isCurrentWeek() {
  return week.weekStart === currentWeekStart();
}

/* ── Rendering ────────────────────────────────────────────────────── */

function render() {
  el("week-title").textContent = formatDayMonth(sundayOf(week.weekStart));
  el("type-name").textContent = type.name;
  renderDays();
  renderTotals();
}

function renderDays() {
  const days = [...type.days].sort((a, b) => a - b);
  el("days").innerHTML = days.map(dayMarkup).join("");
  if (openDay !== null) mountSlider();
}

function dayMarkup(day) {
  const shift = week.days[day];
  const isOpen = openDay === day;
  const isToday = isCurrentWeek() && todayNumber() === day;

  const classes = ["sh-day"];
  if (shift) classes.push("sh-day--filled");
  if (isOpen) classes.push("sh-day--open");

  const value = shift
    ? `<span class="sh-day__value">
         <span class="sh-day__hours" data-hours="${day}">${formatHrs(shiftMinutes(shift))}</span>
         ${isOpen ? "" : `<span class="sh-day__times">${formatTime(shift.start)} – ${formatTime(shift.end)}</span>`}
       </span>`
    : `<span class="sh-day__add" aria-hidden="true">+</span>`;

  const clear = shift
    ? `<button class="sh-day__clear" type="button" data-clear="${day}"
               aria-label="Clear ${DAY_NAMES[day - 1]}">
         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
       </button>`
    : "";

  return `
    <div class="${classes.join(" ")}">
      <button class="sh-day__head" type="button" data-open="${day}"
              aria-expanded="${isOpen}">
        <span class="sh-day__name">
          ${isToday ? '<span class="sh-day__today" aria-hidden="true"></span>' : ""}
          ${DAY_NAMES[day - 1]}
        </span>
        ${value}
      </button>
      ${clear}
      ${isOpen ? `<div class="sh-day__panel" data-panel="${day}"></div>` : ""}
    </div>
  `;
}

function mountSlider() {
  const panel = document.querySelector(`[data-panel="${openDay}"]`);
  if (!panel) return;
  const shift = week.days[openDay];

  slider = createRangeSlider(panel, {
    start: shift.start,
    end: shift.end,
    onChange: (start, end) => {
      week.days[openDay] = { start, end };
      const label = document.querySelector(`[data-hours="${openDay}"]`);
      if (label) label.textContent = formatHrs(end - start);
      renderTotals();
    },
    onCommit: persist,
  });

  panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function renderTotals() {
  const total = totalMinutes(week, type.days);
  el("total-hours").textContent = formatDuration(total);

  const rate = settings.hourlyRate;
  const payLine = el("pay-line");
  if (rate) {
    el("pay-value").textContent = `${((total / 60) * rate).toFixed(2)}€`;
    payLine.hidden = false;
  } else {
    payLine.hidden = true;
  }

  const summary = buildSummary(week, type.days);
  el("preview").hidden = summary === null;
  if (summary) el("preview-text").textContent = summary;
  el("copy").disabled = summary === null;
}

/* ── Interazioni della settimana ──────────────────────────────────── */

function toggleDay(day) {
  if (openDay === day) {
    openDay = null;
  } else {
    if (!week.days[day]) week.days[day] = { ...DEFAULT_SHIFT };
    openDay = day;
    persist();
  }
  render();
}

function clearDay(day) {
  delete week.days[day];
  if (openDay === day) openDay = null;
  persist();
  render();
}

async function copySummary() {
  const summary = buildSummary(week, type.days);
  if (!summary) return;
  const done = await copyText(summary);
  toast(done ? "Copied" : "Could not copy — press and hold the message to copy it");
}

/* ── Tipo di settimana ────────────────────────────────────────────── */

function daysLabel(days) {
  return [...days].sort((a, b) => a - b).map((d) => DAY_NAMES[d - 1].slice(0, 3)).join(" · ");
}

function openTypeSheet() {
  el("type-options").innerHTML = allTypes(settings)
    .map(
      (t) => `
      <button class="sh-sheet__option" type="button" data-type="${t.id}"
              aria-selected="${t.id === type.id}">
        <span>${escapeHtml(t.name)}</span>
        <span class="sh-sheet__days">${daysLabel(t.days)}</span>
      </button>`
    )
    .join("");
  el("scrim").hidden = false;
  el("type-sheet").hidden = false;
}

function closeTypeSheet() {
  el("scrim").hidden = true;
  el("type-sheet").hidden = true;
}

function chooseType(typeId) {
  const next = findType(settings, typeId);
  applyType(next);
  settings.lastTypeId = next.id;
  saveSettings(settings);
  openDay = null;
  closeTypeSheet();
  render();
}

/* ── Impostazioni ─────────────────────────────────────────────────── */

function openSettings() {
  el("hourly-rate").value = settings.hourlyRate ?? "";
  renderTypeSettings();
  el("settings-layer").hidden = false;
}

function renderTypeSettings() {
  const fixed = allTypes(settings)
    .filter((t) => t.fixed)
    .map(
      (t) => `
      <div class="sh-row">
        <span class="sh-row__label">${t.name}</span>
        <span class="sh-row__value">${daysLabel(t.days)}</span>
      </div>`
    )
    .join("");

  const customs = settings.customTypes
    .map(
      (t) => `
      <div class="sh-row sh-row--stacked" data-custom="${t.id}">
        <div style="display:flex; align-items:center; gap: var(--sh-space-2)">
          <input class="sh-typename" type="text" maxlength="${MAX_TYPE_NAME}"
                 value="${escapeHtml(t.name)}" data-rename="${t.id}"
                 aria-label="Week type name" placeholder="Name">
          <button class="sh-iconbtn sh-iconbtn--plain" type="button" data-delete-type="${t.id}"
                  aria-label="Delete ${escapeHtml(t.name)}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div class="sh-daypicker">
          ${DAY_INITIALS.map(
            (initial, index) => `
            <button class="sh-daypicker__day" type="button"
                    data-toggle-day="${index + 1}" data-type-id="${t.id}"
                    aria-pressed="${t.days.includes(index + 1)}"
                    aria-label="${DAY_NAMES[index]}">${initial}</button>`
          ).join("")}
        </div>
      </div>`
    )
    .join("");

  el("type-list").innerHTML = fixed + customs;

  const left = MAX_CUSTOM_TYPES - settings.customTypes.length;
  el("add-type").hidden = left <= 0;
  el("type-note").textContent =
    left > 0
      ? `Week and Weekend are always there. You can add ${left} more of your own.`
      : "You have all three of your own week types.";
}

function addCustomType() {
  if (settings.customTypes.length >= MAX_CUSTOM_TYPES) return;
  // Identificativi fissi custom-1..3: crearne tre di fila non deve produrre
  // tre volte lo stesso id.
  const used = new Set(settings.customTypes.map((t) => t.id));
  const id = ["custom-1", "custom-2", "custom-3"].find((candidate) => !used.has(candidate));
  if (!id) return;

  settings.customTypes.push({ id, name: "My week", days: [1] });
  saveSettings(settings);
  renderTypeSettings();
}

function deleteCustomType(typeId) {
  settings.customTypes = settings.customTypes.filter((t) => t.id !== typeId);
  saveSettings(settings);
  // La settimana in corso non può restare su un tipo che non esiste più.
  if (type.id === typeId) {
    applyType(findType(settings, "week"));
    settings.lastTypeId = "week";
    saveSettings(settings);
    openDay = null;
  }
  renderTypeSettings();
  render();
}

function renameCustomType(typeId, name) {
  const custom = settings.customTypes.find((t) => t.id === typeId);
  if (!custom) return;
  custom.name = name.slice(0, MAX_TYPE_NAME);
  saveSettings(settings);
  if (type.id === typeId) {
    applyType({ ...type, name: custom.name });
    el("type-name").textContent = custom.name;
  }
}

function toggleCustomDay(typeId, day) {
  const custom = settings.customTypes.find((t) => t.id === typeId);
  if (!custom) return;
  const next = custom.days.includes(day)
    ? custom.days.filter((d) => d !== day)
    : [...custom.days, day];
  if (next.length === 0) return; // almeno un giorno, sempre
  custom.days = next.sort((a, b) => a - b);
  saveSettings(settings);
  if (type.id === typeId) {
    applyType({ ...type, days: custom.days });
    render();
  }
  renderTypeSettings();
}

function readRate(value) {
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/* ── Notifiche ────────────────────────────────────────────────────── */

function toast(message, ms = 4000) {
  const node = document.createElement("div");
  node.className = "sh-toast";
  node.innerHTML = `
    <span class="sh-toast__icon" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 7"/></svg>
    </span>
    <span></span>`;
  node.lastElementChild.textContent = message;
  el("toasts").appendChild(node);

  setTimeout(() => {
    node.classList.add("sh-toast--leaving");
    setTimeout(() => node.remove(), 300);
  }, ms);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

/* ── Eventi ───────────────────────────────────────────────────────── */

function bindEvents() {
  el("days").addEventListener("click", (event) => {
    const clear = event.target.closest("[data-clear]");
    if (clear) return clearDay(Number(clear.dataset.clear));
    const open = event.target.closest("[data-open]");
    if (open) return toggleDay(Number(open.dataset.open));
  });

  el("copy").addEventListener("click", copySummary);
  el("open-types").addEventListener("click", openTypeSheet);
  el("scrim").addEventListener("click", closeTypeSheet);
  el("open-settings").addEventListener("click", openSettings);

  el("type-sheet").addEventListener("click", (event) => {
    const option = event.target.closest("[data-type]");
    if (option) chooseType(option.dataset.type);
  });

  document.addEventListener("click", (event) => {
    const close = event.target.closest("[data-close]");
    if (close) el(close.dataset.close).hidden = true;
  });

  el("hourly-rate").addEventListener("input", (event) => {
    settings.hourlyRate = readRate(event.target.value);
    saveSettings(settings);
    renderTotals();
  });

  el("add-type").addEventListener("click", addCustomType);

  el("type-list").addEventListener("click", (event) => {
    const remove = event.target.closest("[data-delete-type]");
    if (remove) return deleteCustomType(remove.dataset.deleteType);
    const day = event.target.closest("[data-toggle-day]");
    if (day) return toggleCustomDay(day.dataset.typeId, Number(day.dataset.toggleDay));
  });

  el("type-list").addEventListener("input", (event) => {
    const rename = event.target.closest("[data-rename]");
    if (rename) renameCustomType(rename.dataset.rename, rename.value);
  });

  // Se resta aperta per giorni, al rientro la settimana potrebbe essere cambiata.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && week.weekStart !== currentWeekStart()) location.reload();
  });
}

/* ── Aggiornamenti dell'app ───────────────────────────────────────── */

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.register("service-worker.js").catch(() => {
    // Senza service worker l'app funziona lo stesso, solo non offline.
  });

  // Alla primissima apertura il service worker prende il controllo per la prima
  // volta: non è un aggiornamento, quindi non si ricarica niente.
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloading) return;
    reloading = true;
    location.reload(); // versione nuova pronta: si passa a quella
  });
}

start();
