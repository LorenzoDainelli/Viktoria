/* Shift Hours — persistenza.
 *
 * Tutto vive in localStorage, sul telefono: nessun server, nessun account.
 * La paga oraria è un dato personale e non ha mai un valore di default nel
 * codice (vedi PIANO-FASE-1-v2.md, regola 13).
 */

import { toISODate, mondayOf } from "./week.js";

const KEY_SETTINGS = "shifthours:settings";
const KEY_CURRENT = "shifthours:current-week";
const KEY_HISTORY = "shifthours:history";

export const FIXED_TYPES = [
  { id: "week", name: "Week", days: [1, 2, 3, 4, 5, 6, 7], fixed: true },
  { id: "weekend", name: "Weekend", days: [6, 7], fixed: true },
];

export const MAX_CUSTOM_TYPES = 3;
export const MAX_TYPE_NAME = 20;

const DEFAULT_SETTINGS = {
  lastTypeId: "week",
  hourlyRate: null,
  customTypes: [],
};

/* ── Accesso grezzo ───────────────────────────────────────────────── */

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    // Memoria piena, dati corrotti o navigazione privata: si riparte pulito
    // invece di lasciare l'app bloccata.
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ── Impostazioni ─────────────────────────────────────────────────── */

export function loadSettings() {
  const stored = read(KEY_SETTINGS, {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    customTypes: Array.isArray(stored.customTypes)
      ? stored.customTypes.slice(0, MAX_CUSTOM_TYPES)
      : [],
  };
}

export function saveSettings(settings) {
  return write(KEY_SETTINGS, settings);
}

/** Tutti i tipi disponibili: i due fissi più i personalizzati validi. */
export function allTypes(settings) {
  const customs = settings.customTypes.filter((t) => t.days.length > 0);
  return [...FIXED_TYPES, ...customs];
}

export function findType(settings, typeId) {
  return allTypes(settings).find((t) => t.id === typeId) || FIXED_TYPES[0];
}

/* ── Settimana corrente ───────────────────────────────────────────── */

export function newWeek(weekStartISO, type) {
  return {
    weekStart: weekStartISO,
    typeId: type.id,
    typeName: type.name,
    // I giorni del tipo sono salvati dentro la settimana: una settimana
    // archiviata resta leggibile anche se quel tipo viene poi eliminato.
    typeDays: [...type.days],
    days: {},
  };
}

export function loadCurrentWeek() {
  const week = read(KEY_CURRENT, null);
  if (!week || typeof week.weekStart !== "string" || typeof week.days !== "object") {
    return null;
  }
  return week;
}

export function saveCurrentWeek(week) {
  return write(KEY_CURRENT, week);
}

/* ── Storico ──────────────────────────────────────────────────────── */

export function loadHistory() {
  const history = read(KEY_HISTORY, []);
  return Array.isArray(history) ? history : [];
}

export function saveHistory(history) {
  return write(KEY_HISTORY, history);
}

/** Archivia una settimana in cima allo storico. Nessun limite di quantità. */
export function pushHistory(week) {
  const history = loadHistory().filter((w) => w.weekStart !== week.weekStart);
  history.unshift(week);
  history.sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  return saveHistory(history);
}

/** Salva le modifiche fatte a una settimana già archiviata. */
export function updateHistoryWeek(week) {
  const history = loadHistory();
  const index = history.findIndex((w) => w.weekStart === week.weekStart);
  if (index === -1) return pushHistory(week);
  history[index] = week;
  return saveHistory(history);
}

export function deleteHistoryWeek(weekStartISO) {
  return saveHistory(loadHistory().filter((w) => w.weekStart !== weekStartISO));
}

export function findHistoryWeek(weekStartISO) {
  return loadHistory().find((w) => w.weekStart === weekStartISO) || null;
}

/* ── Backup ───────────────────────────────────────────────────────── */

export function exportAll() {
  return {
    exportedAt: toISODate(new Date()),
    settings: loadSettings(),
    currentWeek: loadCurrentWeek(),
    history: loadHistory(),
  };
}

/** Lunedì di oggi, secondo l'orologio del telefono. */
export function currentWeekStart() {
  return toISODate(mondayOf(new Date()));
}
