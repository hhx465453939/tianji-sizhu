import { describe, it, expect } from 'vitest'
import { calculateBazi } from '../calculator'
import type { BaziInput } from '../types'

describe('calculateBazi - known case verification', () => {
  // Test with known historical dates to verify algorithm correctness
  // Reference: 1990-06-15 卯时 male (solar calendar)

  it('should calculate correct year pillar for 1990', () => {
    const input: BaziInput = { year: 1990, month: 6, day: 15, hour: 3, gender: 0, calendar: 0 }
    const result = calculateBazi(input)
    // 1990 is 庚午年
    expect(result.yearGan).toBe('庚')
    expect(result.yearZhi).toBe('午')
  })

  it('should calculate correct day master element', () => {
    const input: BaziInput = { year: 1990, month: 6, day: 15, hour: 3, gender: 0, calendar: 0 }
    const result = calculateBazi(input)
    // Day master should be one of valid stems
    const validStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
    expect(validStems).toContain(result.dayMaster)
    // Element should match
    const stemToElement: Record<string, string> = {
      '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
      '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
    }
    expect(result.dayMasterWuXing).toBe(stemToElement[result.dayMaster])
  })

  it('should have wuXingPower summing to a reasonable total', () => {
    const input: BaziInput = { year: 1990, month: 6, day: 15, hour: 3, gender: 0, calendar: 0 }
    const result = calculateBazi(input)
    const total = Object.values(result.wuXingPower).reduce((a, b) => a + b, 0)
    expect(total).toBeGreaterThan(0)
    expect(total).toBeLessThan(500)
  })

  it('should return valid naYin for all pillars', () => {
    const input: BaziInput = { year: 1990, month: 6, day: 15, hour: 3, gender: 0, calendar: 0 }
    const result = calculateBazi(input)
    expect(result.pillars.year.naYin.length).toBeGreaterThan(0)
    expect(result.pillars.month.naYin.length).toBeGreaterThan(0)
    expect(result.pillars.day.naYin.length).toBeGreaterThan(0)
    expect(result.pillars.time.naYin.length).toBeGreaterThan(0)
  })

  it('should have valid shiShen for year/month/time pillars', () => {
    const input: BaziInput = { year: 1990, month: 6, day: 15, hour: 3, gender: 0, calendar: 0 }
    const result = calculateBazi(input)
    const validShiShen = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印', '']
    expect(validShiShen).toContain(result.pillars.year.shiShenGan)
    expect(validShiShen).toContain(result.pillars.month.shiShenGan)
    expect(validShiShen).toContain(result.pillars.time.shiShenGan)
  })

  it('should produce consistent results for same input', () => {
    const input: BaziInput = { year: 2000, month: 1, day: 1, hour: 0, gender: 1, calendar: 0 }
    const result1 = calculateBazi(input)
    const result2 = calculateBazi(input)
    expect(result1.yearGan).toBe(result2.yearGan)
    expect(result1.dayGan).toBe(result2.dayGan)
    expect(result1.hourZhi).toBe(result2.hourZhi)
  })

  it('should handle leap year dates correctly', () => {
    const input: BaziInput = { year: 2000, month: 2, day: 29, hour: 6, gender: 0, calendar: 0 }
    const result = calculateBazi(input)
    expect(result.yearGan).toBeTruthy()
    expect(result.dayGan).toBeTruthy()
  })

  it('should have taiYuan and mingGong filled', () => {
    const input: BaziInput = { year: 1985, month: 3, day: 20, hour: 5, gender: 0, calendar: 0 }
    const result = calculateBazi(input)
    expect(result.taiYuan.length).toBeGreaterThan(0)
    expect(result.mingGong.length).toBeGreaterThan(0)
  })

  it('should have shensha data structure', () => {
    const input: BaziInput = { year: 1990, month: 6, day: 15, hour: 3, gender: 0, calendar: 0 }
    const result = calculateBazi(input)
    expect(result.shensha).toBeDefined()
    expect(Array.isArray(result.shensha.nian)).toBe(true)
    expect(Array.isArray(result.shensha.yue)).toBe(true)
    expect(Array.isArray(result.shensha.ri)).toBe(true)
    expect(Array.isArray(result.shensha.shi)).toBe(true)
  })

  it('should handle boundary years correctly', () => {
    // Test early year
    const early: BaziInput = { year: 1924, month: 1, day: 1, hour: 0, gender: 0, calendar: 0 }
    const r1 = calculateBazi(early)
    expect(r1.yearGan).toBeTruthy()

    // Test future year
    const future: BaziInput = { year: 2050, month: 12, day: 31, hour: 11, gender: 1, calendar: 0 }
    const r2 = calculateBazi(future)
    expect(r2.yearGan).toBeTruthy()
  })

  // ── Lunar input tests ─────────────────────────────────────────────

  it('should produce the same result when lunar input matches solar equivalent', () => {
    // Lunar 1990/5/15 = Solar 1990/6/7 (verified via lunar-javascript)
    const solarInput: BaziInput = { year: 1990, month: 6, day: 7, hour: 6, gender: 0, calendar: 0 }
    const lunarInput: BaziInput = { year: 1990, month: 5, day: 15, hour: 6, gender: 0, calendar: 1 }

    const solarResult = calculateBazi(solarInput)
    const lunarResult = calculateBazi(lunarInput)

    // The four pillars should be identical
    expect(lunarResult.yearGan).toBe(solarResult.yearGan)
    expect(lunarResult.yearZhi).toBe(solarResult.yearZhi)
    expect(lunarResult.monthGan).toBe(solarResult.monthGan)
    expect(lunarResult.monthZhi).toBe(solarResult.monthZhi)
    expect(lunarResult.dayGan).toBe(solarResult.dayGan)
    expect(lunarResult.dayZhi).toBe(solarResult.dayZhi)
    expect(lunarResult.hourGan).toBe(solarResult.hourGan)
    expect(lunarResult.hourZhi).toBe(solarResult.hourZhi)
  })

  it('should produce different results for lunar vs raw solar of same numbers', () => {
    // Without lunar conversion, 1990/5/15 as solar would be wrong
    const wrongSolar: BaziInput = { year: 1990, month: 5, day: 15, hour: 3, gender: 0, calendar: 0 }
    const correctLunar: BaziInput = { year: 1990, month: 5, day: 15, hour: 3, gender: 0, calendar: 1 }

    const wrongResult = calculateBazi(wrongSolar)
    const correctResult = calculateBazi(correctLunar)

    // Day pillars should differ because the actual solar dates are different
    expect(correctResult.dayGan).not.toBe(wrongResult.dayGan)
  })

  it('should have lunarDate for lunar input', () => {
    const lunarInput: BaziInput = { year: 1990, month: 5, day: 15, hour: 3, gender: 0, calendar: 1 }
    const result = calculateBazi(lunarInput)

    expect(result.lunarDate).not.toBeNull()
    expect(result.lunarDate!.year).toBe(1990)
    expect(result.lunarDate!.month).toBe(5)
    expect(result.lunarDate!.day).toBe(15)
  })
})
