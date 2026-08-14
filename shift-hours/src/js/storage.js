/* Shift Hours — persistenza.
 *
 * Tutto vive in localStorage, sul telefono: nessun server, nessun account.
 * La paga oraria è un dato personale e non ha mai un valore di default nel
 * codice (vedi PIANO-FASE-1-v2.md, regola 13).
 */

import { toISODate, mondayOf } from "./week.js";
import { sundayOfWeek, weeksWithin } from "./backup.js";
import { latestAmount, ratesFromSettings } from "./rates.js";

const KEY_SETTINGS = "shifthours:settings";
const KEY_CURRENT = "shifthours:current-week";
const KEY_HISTORY = "shifthours:history";
const KEY_BACKUP = "shifthours:backup";

/*
 * Numero di versione del file esportato.
 *
 *   1 — Fase 1: nessun campo `version`.
 *   2 — Fase 2: aggiunti `coversUntil` e `label`.
 *   3 — Fase 3: la paga oraria diventa `settings.rates`, una lista.
 *
 * Tutte e tre si continuano a ripristinare: un backup fatto oggi deve restare
 * utile fra due anni.
 */
export const BACKUP_VERSION = 3;

export const FIXED_TYPES = [
  { id: "week", name: "Full Week", days: [1, 2, 3, 4, 5, 6, 7], fixed: true },
  { id: "weekend", name: "Weekend", days: [6, 7], fixed: true },
];

/**
 * Il nome da mostrare per un tipo salvato dentro una settimana.
 *
 * I tipi fissi non si possono cancellare, quindi il loro nome attuale vince
 * sempre: se no una settimana archiviata prima della Fase 3 direbbe "Week" e
 * quella di questa settimana "Full Week", nello stesso elenco.
 * Per i tipi personalizzati vale il nome salvato nella settimana, che è
 * l'unico rimasto quando quel tipo è stato eliminato.
 */
export function displayTypeName(typeId, storedName) {
  return FIXED_TYPES.find((t) => t.id === typeId)?.name ?? storedName;
}

export const MAX_CUSTOM_TYPES = 3;
export const MAX_TYPE_NAME = 20;

const DEFAULT_SETTINGS = {
  lastTypeId: "week",
  rates: [],
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
  // La migrazione dalla Fase 2 avviene qui, a ogni lettura: un vecchio
  // `hourlyRate` diventa la prima paga della lista, valida dall'inizio dei
  // tempi. Nessuna stima cambia (vedi rates.js).
  const rates = ratesFromSettings(stored);
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    rates,
    // Resta scritto per i backup, così un telefono fermo a una versione
    // vecchia riesce ancora a leggere il file. Non è più la verità: quella è
    // `rates`, e nessuno nell'app legge più questo campo.
    hourlyRate: latestAmount(rates),
    customTypes: Array.isArray(stored.customTypes)
      ? stored.customTypes.slice(0, MAX_CUSTOM_TYPES)
      : [],
  };
}

export function saveSettings(settings) {
  const rates = ratesFromSettings(settings);
  return write(KEY_SETTINGS, { ...settings, rates, hourlyRate: latestAmount(rates) });
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

/* ── Copie di sicurezza: stato ────────────────────────────────────── */

/** Cosa è già stato salvato. Vive sul telefono come tutto il resto. */
export function loadBackupState() {
  const stored = read(KEY_BACKUP, null);
  const base = { lastMonth: null, lastSavedAt: null, lastLabel: null };
  return stored && typeof stored === "object" ? { ...base, ...stored } : base;
}

export function saveBackupState(state) {
  return write(KEY_BACKUP, state);
}

/* ── Copie di sicurezza: esportazione ─────────────────────────────── */

/** Tutte le settimane conosciute, corrente inclusa. */
export function allWeeks() {
  return [loadCurrentWeek(), ...loadHistory()].filter(Boolean);
}

/** La domenica più lontana fra quelle settimane: è la "fine" di un backup. */
function lastSunday(weeks) {
  const sundays = weeks.map((entry) => toISODate(sundayOfWeek(entry.weekStart)));
  return sundays.length ? sundays.sort().at(-1) : toISODate(sundayOfWeek(currentWeekStart()));
}

function envelope(weeks, { label = null, current = null, until = null }) {
  return {
    app: "shift-hours",
    version: BACKUP_VERSION,
    exportedAt: toISODate(new Date()),
    coversUntil: until ?? lastSunday(weeks),
    label,
    settings: loadSettings(),
    currentWeek: current,
    // Confronto per data, non per identità: loadCurrentWeek() restituisce un
    // oggetto nuovo a ogni chiamata, e la settimana in corso finirebbe nel file
    // due volte.
    history: weeks.filter((entry) => entry.weekStart !== current?.weekStart),
  };
}

/** Fotografia completa fino a oggi, settimana in corso inclusa. */
export function exportAll() {
  const current = loadCurrentWeek();
  return envelope(allWeeks(), { current });
}

/**
 * File mensile: tutto dall'inizio fino al taglio, senza la settimana in corso.
 * È cumulativo per costruzione — `September26` contiene anche agosto.
 */
export function exportUntil(coversUntilISO, label) {
  return envelope(weeksWithin(allWeeks(), coversUntilISO), { label, until: coversUntilISO });
}

/* ── Copie di sicurezza: ripristino ───────────────────────────────── */

function isWeek(entry) {
  return Boolean(
    entry &&
    typeof entry === "object" &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.weekStart) &&
    entry.days &&
    typeof entry.days === "object"
  );
}

/**
 * Legge e controlla il testo di un file di backup. Non tocca niente:
 * serve a poter mostrare la conferma prima di scrivere.
 *
 * @throws {Error} se il file non è un backup di questa app
 */
export function readBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("not-json");
  }
  if (!data || typeof data !== "object") throw new Error("not-a-backup");

  const weeks = [
    ...(Array.isArray(data.history) ? data.history : []),
    data.currentWeek,
  ].filter(isWeek);

  // Un backup senza nemmeno una settimana non è un backup di cui fidarsi.
  if (weeks.length === 0) throw new Error("no-weeks");

  return {
    version: Number(data.version) || 1,
    label: typeof data.label === "string" ? data.label : null,
    coversUntil: /^\d{4}-\d{2}-\d{2}$/.test(data.coversUntil)
      ? data.coversUntil
      : lastSunday(weeks),
    settings: data.settings && typeof data.settings === "object" ? data.settings : {},
    weeks,
  };
}

/**
 * Rimette dentro un backup già controllato.
 *
 * Regola 1 del piano: **non si cancella mai una settimana più recente del
 * file**. Qui è garantita dal fatto che si parte da ciò che c'è nel telefono e
 * le settimane del file si sovrappongono soltanto; niente viene mai rimosso.
 */
export function applyBackup(parsed) {
  const today = currentWeekStart();

  const merged = new Map(loadHistory().map((entry) => [entry.weekStart, entry]));
  for (const entry of parsed.weeks) merged.set(entry.weekStart, entry);

  // La settimana di oggi vive nella sua chiave, non nello storico.
  const restoredCurrent = merged.get(today) ?? null;
  merged.delete(today);

  const history = [...merged.values()].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  saveHistory(history);

  // Se il file non contiene la settimana di oggi, quella del telefono resta
  // intatta: è esattamente il caso del backup mensile.
  const current = restoredCurrent ?? loadCurrentWeek();
  if (current) saveCurrentWeek(current);

  const device = loadSettings();
  // Un file di Fase 1 o 2 porta un solo `hourlyRate`: ratesFromSettings lo
  // trasforma nella prima paga della lista. Una lista già presente nel file
  // vince su quella; se il file non ne ha nessuna, resta quella del telefono —
  // una paga impostata non viene mai azzerata da un file che non ce l'ha.
  const fromFile = ratesFromSettings(parsed.settings);
  saveSettings({
    ...device,
    ...parsed.settings,
    rates: fromFile.length > 0 ? fromFile : device.rates,
    customTypes: Array.isArray(parsed.settings.customTypes)
      ? parsed.settings.customTypes.slice(0, MAX_CUSTOM_TYPES)
      : device.customTypes,
  });

  return { weeks: parsed.weeks.length, history: history.length };
}

/** Lunedì di oggi, secondo l'orologio del telefono. */
export function currentWeekStart() {
  return toISODate(mondayOf(new Date()));
}
