import type { BaziResult } from './types'

// Adapter layer for mystilight-8char
// This abstraction isolates the library so we can swap implementations later
export function calculateBazi(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: number,
  calendar: number
): BaziResult {
  try {
    // Dynamic import workaround - mystilight-8char exports
    // We'll try to use the library, falling back to a placeholder if needed
    const lib = (window as any).__mystilight

    if (lib) {
      return computeWithMystilight(lib, year, month, day, hour, gender, calendar)
    }
  } catch (e) {
    console.warn('mystilight-8char not available, using basic calculation', e)
  }

  // Basic fallback calculation using traditional algorithms
  return basicCalculation(year, month, day, hour, gender)
}

function computeWithMystilight(
  lib: any,
  year: number, month: number, day: number, hour: number,
  gender: number, calendar: number
): BaziResult {
  const result = lib.calculate({ year, month, day, hour, gender, calendar })
  return {
    yearStem: result.fourPillars?.year?.stem || '',
    yearBranch: result.fourPillars?.year?.branch || '',
    monthStem: result.fourPillars?.month?.stem || '',
    monthBranch: result.fourPillars?.month?.branch || '',
    dayStem: result.fourPillars?.day?.stem || '',
    dayBranch: result.fourPillars?.day?.branch || '',
    hourStem: result.fourPillars?.hour?.stem || '',
    hourBranch: result.fourPillars?.hour?.branch || '',
    dayMasterElement: result.dayMaster?.element,
    tenGods: result.tenGods,
    spirits: result.spirits?.map((s: any) => s.name),
    luck: result.luck?.periods,
    fiveElements: result.fiveElements,
    rawData: result,
  }
}

// Basic standalone calculation (no external dependency)
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const ELEMENTS_MAP: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}

function basicCalculation(year: number, month: number, day: number, hour: number, gender: number): BaziResult {
  // Year pillar
  const yearOffset = (year - 4) % 60
  const yearStemIdx = yearOffset % 10
  const yearBranchIdx = yearOffset % 12

  // Month pillar (simplified - uses year stem to determine month stem)
  const monthBranchIdx = (month + 1) % 12
  const monthStemBase = (yearStemIdx % 5) * 2
  const monthStemIdx = (monthStemBase + month - 1) % 10

  // Day pillar (simplified Zeller-like formula)
  const dayNum = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(1900, 0, 31)) / 86400000)
  const dayStemIdx = ((dayNum % 10) + 10) % 10
  const dayBranchIdx = ((dayNum % 12) + 12) % 12

  // Hour pillar
  const hourBranchIdx = hour % 12
  const hourStemBase = (dayStemIdx % 5) * 2
  const hourStemIdx = (hourStemBase + hour) % 10

  const dayStem = STEMS[dayStemIdx]

  // Basic luck periods
  const luck = []
  const startAge = gender === 0 ? 3 : 4
  for (let i = 0; i < 8; i++) {
    const idx = gender === 0
      ? (monthStemIdx + i + 1) % 10
      : ((monthStemIdx - i - 1) + 10) % 10
    const bIdx = gender === 0
      ? (monthBranchIdx + i + 1) % 12
      : ((monthBranchIdx - i - 1) + 12) % 12
    luck.push({
      stem: STEMS[idx],
      branch: BRANCHES[bIdx],
      startAge: startAge + i * 10,
      endAge: startAge + (i + 1) * 10 - 1,
    })
  }

  return {
    yearStem: STEMS[yearStemIdx],
    yearBranch: BRANCHES[yearBranchIdx],
    monthStem: STEMS[monthStemIdx],
    monthBranch: BRANCHES[monthBranchIdx],
    dayStem,
    dayBranch: BRANCHES[dayBranchIdx],
    hourStem: STEMS[hourStemIdx],
    hourBranch: BRANCHES[hourBranchIdx],
    dayMasterElement: ELEMENTS_MAP[dayStem],
    luck,
  }
}
