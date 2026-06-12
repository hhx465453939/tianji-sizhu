import { describe, it, expect } from 'vitest'
import { calculateBazi } from '../calculator'
import type { BaziInput } from '../types'

describe('calculateBazi', () => {
  const baseInput: BaziInput = {
    year: 1990,
    month: 6,
    day: 15,
    hour: 3,
    gender: 0,
    calendar: 0,
  }

  it('should return a valid BaziResult with all required fields', () => {
    const result = calculateBazi(baseInput)

    expect(result.yearGan).toBeTruthy()
    expect(result.yearZhi).toBeTruthy()
    expect(result.monthGan).toBeTruthy()
    expect(result.monthZhi).toBeTruthy()
    expect(result.dayGan).toBeTruthy()
    expect(result.dayZhi).toBeTruthy()
    expect(result.hourGan).toBeTruthy()
    expect(result.hourZhi).toBeTruthy()
    expect(result.dayMaster).toBeTruthy()
    expect(result.dayMasterWuXing).toBeTruthy()
  })

  it('should have valid five element power values', () => {
    const result = calculateBazi(baseInput)

    expect(result.wuXingPower).toBeDefined()
    expect(typeof result.wuXingPower['木']).toBe('number')
    expect(typeof result.wuXingPower['火']).toBe('number')
    expect(typeof result.wuXingPower['土']).toBe('number')
    expect(typeof result.wuXingPower['金']).toBe('number')
    expect(typeof result.wuXingPower['水']).toBe('number')
  })

  it('should have dayunArr with fortune periods', () => {
    const result = calculateBazi(baseInput)

    expect(Array.isArray(result.dayunArr)).toBe(true)
    expect(result.dayunArr.length).toBeGreaterThan(0)
    // First entry may be pre-fortune (empty ganZhi), check that at least one has real data
    const realDayun = result.dayunArr.find(d => d.ganZhi !== '')
    expect(realDayun).toBeDefined()
    expect(realDayun!.startYear).toBeGreaterThan(1900)
  })

  it('should have pillar objects with full info', () => {
    const result = calculateBazi(baseInput)

    const p = result.pillars.year
    expect(p.gan).toBeTruthy()
    expect(p.zhi).toBeTruthy()
    expect(p.naYin).toBeTruthy()
    expect(p.hideGan).toBeTruthy()
  })

  it('should handle female gender correctly', () => {
    const femaleInput: BaziInput = { ...baseInput, gender: 1 }
    const result = calculateBazi(femaleInput)

    expect(result.yunInfo.forward).toBeDefined()
    expect(result.dayGan).toBeTruthy()
  })

  it('should handle different birth hours', () => {
    for (let hour = 0; hour < 12; hour++) {
      const input: BaziInput = { ...baseInput, hour }
      const result = calculateBazi(input)
      expect(result.hourGan).toBeTruthy()
      expect(result.hourZhi).toBeTruthy()
    }
  })

  it('should have rawData for export', () => {
    const result = calculateBazi(baseInput)
    expect(result.rawData).toBeDefined()
    expect(result.rawData.pillars).toBeDefined()
  })

  it('should have lunarDate for solar input', () => {
    const result = calculateBazi(baseInput)
    expect(result.lunarDate).toBeDefined()
    expect(result.lunarDate).not.toBeNull()
    expect(result.lunarDate!.fullString).toBeTruthy()
    expect(result.lunarDate!.monthCn).toBeTruthy()
    expect(result.lunarDate!.dayCn).toBeTruthy()
    expect(result.lunarDate!.yearGanZhi).toBeTruthy()
  })
})
