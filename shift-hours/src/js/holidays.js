/* Shift Hours — i bank holiday irlandesi.
 *
 * Le dieci feste sono fissate da regole, non da una lista che qualcuno
 * pubblica ogni anno: qui si calcolano, sempre. Una lista scritta a mano
 * scadrebbe, e sbaglierebbe in silenzio.
 *
 * Il rischio non è teorico: diverse fonti secondarie danno St Brigid's Day
 * 2026 all'1 febbraio. È falso — l'1 è una domenica, quindi la festa è
 * lunedì 2. Con una lista copiata, quel giorno Viktoria sarebbe stata pagata
 * la metà.
 *
 * Tutto locale, mai UTC: si ragiona sull'orologio del suo telefono, come in
 * week.js.
 */

import { toISODate } from "./week.js";

/*
 * Nel bar di Viktoria i bank holiday sono pagati il doppio (confermato il
 * 14 agosto 2026). Non è un obbligo di legge: l'Organisation of Working Time
 * Act 1997, sezione 21, lascia al datore di lavoro la scelta fra quattro
 * forme di compenso — un giorno di paga in più, un giorno libero pagato, un
 * giorno di ferie in più, o un giorno libero entro il mese.
 *
 * Se un giorno cambiasse, si cambia qui e in nessun altro posto.
 */
export const HOLIDAY_MULTIPLIER = 2;

/* ── Le regole ────────────────────────────────────────────────────── */

/** Domenica di Pasqua, calendario gregoriano (algoritmo anonimo). */
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** L'n-esimo `weekday` del mese. weekday: 0 = domenica … 1 = lunedì. */
function nthWeekday(year, month, weekday, n) {
  const d = new Date(year, month - 1, 1);
  d.setDate(1 + ((weekday - d.getDay() + 7) % 7) + 7 * (n - 1));
  return d;
}

/** L'ultimo `weekday` del mese. */
function lastWeekday(year, month, weekday) {
  const last = new Date(year, month, 0); // giorno 0 del mese dopo
  last.setDate(last.getDate() - ((last.getDay() - weekday + 7) % 7));
  return last;
}

/**
 * St Brigid's Day: il primo lunedì di febbraio, **tranne** quando l'1 febbraio
 * cade di venerdì — in quel caso è quel venerdì.
 */
function stBrigid(year) {
  const first = new Date(year, 1, 1);
  return first.getDay() === 5 ? first : nthWeekday(year, 2, 1, 1);
}

/* ── L'elenco ─────────────────────────────────────────────────────── */

/**
 * Le dieci feste di un anno.
 *
 * Nessuna sostituzione quando cadono di sabato o domenica: in Irlanda le feste
 * sono le date, non i giorni lavorativi spostati.
 *
 * @returns {{date: string, name: string}[]} in ordine di data
 */
export function holidaysOfYear(year) {
  const easterMonday = easterSunday(year);
  easterMonday.setDate(easterMonday.getDate() + 1);

  return [
    { date: new Date(year, 0, 1), name: "New Year's Day" },
    { date: stBrigid(year), name: "St Brigid's Day" },
    { date: new Date(year, 2, 17), name: "St Patrick's Day" },
    { date: easterMonday, name: "Easter Monday" },
    { date: nthWeekday(year, 5, 1, 1), name: "May Bank Holiday" },
    { date: nthWeekday(year, 6, 1, 1), name: "June Bank Holiday" },
    { date: nthWeekday(year, 8, 1, 1), name: "August Bank Holiday" },
    { date: lastWeekday(year, 10, 1), name: "October Bank Holiday" },
    { date: new Date(year, 11, 25), name: "Christmas Day" },
    { date: new Date(year, 11, 26), name: "St Stephen's Day" },
  ]
    .map(({ date, name }) => ({ date: toISODate(date), name }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/*
 * Gli anni già calcolati. Il calendario chiede lo stesso anno una volta per
 * casella: senza questa cache rifarebbe il conto di Pasqua trecento volte per
 * ogni mese che scorre.
 */
const cache = new Map();

function indexOfYear(year) {
  let index = cache.get(year);
  if (!index) {
    index = new Map(holidaysOfYear(year).map((h) => [h.date, h.name]));
    cache.set(year, index);
  }
  return index;
}

/**
 * Il nome della festa che cade in quel giorno, o null.
 * @param {string} iso "2026-08-03"
 */
export function holidayName(iso) {
  return indexOfYear(Number(iso.slice(0, 4))).get(iso) ?? null;
}

/** @param {string} iso "2026-08-03" */
export function isHoliday(iso) {
  return holidayName(iso) !== null;
}

/** Quanto vale un'ora di quel giorno rispetto al solito: 2 se è festa, 1 se no. */
export function payMultiplier(iso) {
  return isHoliday(iso) ? HOLIDAY_MULTIPLIER : 1;
}
