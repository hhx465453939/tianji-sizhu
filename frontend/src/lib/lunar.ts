/**
 * Lunar calendar conversion utilities.
 * Uses `lunar-javascript` for accurate solar ↔ lunar date conversion.
 */
import { Solar, Lunar } from 'lunar-javascript'

// ── Types ─────────────────────────────────────────────────────────

/** Lunar date information with both numeric and Chinese representations */
export interface LunarDateInfo {
  /** Lunar year (e.g. 1990) */
  year: number
  /** Lunar month (negative if leap month, e.g. -4 means leap 4th month) */
  month: number
  /** Lunar day (1-30) */
  day: number
  /** Chinese month name (e.g. "五月") */
  monthCn: string
  /** Chinese day name (e.g. "十五") */
  dayCn: string
  /** Year in Gan-Zhi (e.g. "庚午") */
  yearGanZhi: string
  /** Full readable string (e.g. "庚午年五月十五") */
  fullString: string
}

// ── Conversion functions ──────────────────────────────────────────

/**
 * Convert a lunar date to its solar (Gregorian) equivalent.
 * @returns Solar date components { year, month, day }
 * @throws Error if the lunar date is invalid (e.g. non-existent leap month)
 */
export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0,
): { year: number; month: number; day: number } {
  const lunar = Lunar.fromYmdHms(lunarYear, lunarMonth, lunarDay, hour, minute, second)
  const solar = lunar.getSolar()
  return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() }
}

/**
 * Convert a solar (Gregorian) date to its lunar equivalent with full display info.
 * @returns LunarDateInfo with numeric and Chinese representations
 */
export function solarToLunar(
  solarYear: number,
  solarMonth: number,
  solarDay: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0,
): LunarDateInfo {
  const solar = Solar.fromYmdHms(solarYear, solarMonth, solarDay, hour, minute, second)
  const lunar = solar.getLunar()
  return {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
    monthCn: lunar.getMonthInChinese(),
    dayCn: lunar.getDayInChinese(),
    yearGanZhi: lunar.getYearInGanZhi(),
    fullString: `${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
  }
}
