import mystilight from 'mystilight-8char'
import type { BaziResult, BaziInput, DaYunItem } from './types'

const { getCurrentEightCharJSON } = mystilight as any

const HOUR_TO_TIME: Record<number, number> = {
  0: 23, 1: 1, 2: 3, 3: 5, 4: 7, 5: 9,
  6: 11, 7: 13, 8: 15, 9: 17, 10: 19, 11: 21,
}

/**
 * Calculate shensha for a specific target year/month.
 * Re-runs the bazi calculation with currentYear/currentMonth set to the target date,
 * returning the shensha and currentYun data for that period.
 */
export function calculateShenshaForDate(
  input: BaziInput,
  targetYear: number,
  targetMonth?: number,
  targetDay?: number,
): {
  shensha: BaziResult['shensha']
  currentYun: BaziResult['currentYun']
} {
  const hour = HOUR_TO_TIME[input.hour] ?? 0
  const now = new Date()
  const data = getCurrentEightCharJSON({
    year: input.year,
    month: input.month,
    day: input.day,
    hour: hour,
    minute: 0,
    second: 0,
    gender: input.gender === 0 ? 1 : 0,
    sect: 2,
    currentYear: targetYear,
    currentMonth: targetMonth ?? (now.getMonth() + 1),
    currentDay: targetDay ?? now.getDate(),
  })

  return {
    shensha: data.shensha || { nian: [], yue: [], ri: [], shi: [] },
    currentYun: data.currentYun || { daYun: null, liuNian: null, xiaoYun: null },
  }
}

export interface LiuYueItem {
  month: number           // 1-12
  ganZhi: string          // e.g. '甲午'
  shiShen: string         // e.g. '正财'
  liuYueShensha: string[] // shensha for this month
}

/**
 * Calculate all 12 months (流月) for a given flow year.
 * Calls the library for each month to get gan-zhi and shensha.
 */
export function calculateLiuYueForYear(
  input: BaziInput,
  targetYear: number,
): LiuYueItem[] {
  const hour = HOUR_TO_TIME[input.hour] ?? 0
  const now = new Date()
  const results: LiuYueItem[] = []

  for (let m = 1; m <= 12; m++) {
    const data = getCurrentEightCharJSON({
      year: input.year,
      month: input.month,
      day: input.day,
      hour: hour,
      minute: 0,
      second: 0,
      gender: input.gender === 0 ? 1 : 0,
      sect: 2,
      currentYear: targetYear,
      currentMonth: m,
      currentDay: now.getDate(),
    })

    const liuYue = data.currentYun?.liuYue
    const ganZhi = liuYue?.ganZhi
      ? (Array.isArray(liuYue.ganZhi) ? liuYue.ganZhi.join('') : String(liuYue.ganZhi))
      : ''

    results.push({
      month: m,
      ganZhi,
      shiShen: liuYue?.shiShen || '',
      liuYueShensha: data.shensha?.current?.liuYue || [],
    })
  }

  return results
}

export interface LiuNianDetail {
  year: number
  ganZhi: string
  ganshen: string
  zhishen: string
  daYunShensha: string[]
  liuNianShensha: string[]
}

/**
 * Batch-calculate shensha for all 10 flow years under a DaYun period.
 * Used for comprehensive prompt generation.
 */
export function calculateDaYunAllLiuNian(
  input: BaziInput,
  daYun: DaYunItem,
): LiuNianDetail[] {
  const results: LiuNianDetail[] = []
  for (const ln of daYun.liunianArr) {
    try {
      const data = calculateShenshaForDate(input, ln.year)
      results.push({
        year: ln.year,
        ganZhi: Array.isArray(ln.ganZhi) ? ln.ganZhi.join('') : ln.ganZhi,
        ganshen: ln.ganshen,
        zhishen: ln.zhishen,
        daYunShensha: data.shensha?.current?.daYun || [],
        liuNianShensha: data.shensha?.current?.liuNian || [],
      })
    } catch {
      results.push({
        year: ln.year,
        ganZhi: Array.isArray(ln.ganZhi) ? ln.ganZhi.join('') : ln.ganZhi,
        ganshen: ln.ganshen,
        zhishen: ln.zhishen,
        daYunShensha: [],
        liuNianShensha: [],
      })
    }
  }
  return results
}

export function calculateBazi(input: BaziInput): BaziResult {
  const hour = HOUR_TO_TIME[input.hour] ?? 0

  const data = getCurrentEightCharJSON({
    year: input.year,
    month: input.month,
    day: input.day,
    hour: hour,
    minute: 0,
    second: 0,
    gender: input.gender === 0 ? 1 : 0, // library: 1=male, 0=female
    sect: 2,
  })

  const p = data.pillars

  return {
    yearGan: p.year.gan,
    yearZhi: p.year.zhi,
    monthGan: p.month.gan,
    monthZhi: p.month.zhi,
    dayGan: p.day.gan,
    dayZhi: p.day.zhi,
    hourGan: p.time.gan,
    hourZhi: p.time.zhi,

    pillars: {
      year: mapPillar(p.year),
      month: mapPillar(p.month),
      day: mapPillar(p.day),
      time: mapPillar(p.time),
    },

    dayMaster: p.day.gan,
    dayMasterWuXing: p.day.wuXing?.split('')[0] || '',

    taiYuan: data.taiYuan,
    taiYuanNaYin: data.taiYuanNaYin,
    taiXi: data.taiXi,
    taiXiNaYin: data.taiXiNaYin,
    mingGong: data.mingGong,
    mingGongNaYin: data.mingGongNaYin,
    shenGong: data.shenGong,
    shenGongNaYin: data.shenGongNaYin,

    wuXingPower: data.wuXingPower,

    yunInfo: {
      gender: data.gender,
      forward: data.yun.forward,
      startYear: data.yun.startYear,
      startMonth: data.yun.startMonth,
      startDay: data.yun.startDay,
      startSolar: data.yun.startSolar,
    },
    dayunArr: data.dayunArr || [],

    currentYun: data.currentYun || { daYun: null, liuNian: null, xiaoYun: null },

    ganRelations: data.ganRelations || [],
    zhiRelations: data.zhiRelations || [],

    shensha: data.shensha || { nian: [], yue: [], ri: [], shi: [] },

    analysis: data.analysis || { rishi: [], SanMingTongHui: [], XiYongShen: [] },
    yuanHaiZiping: data.yuanHaiZiping || { yueLing: null, taiSui: null, shenQiang: 0, shidu: 0 },

    rawData: data,
  }
}

function mapPillar(p: any) {
  return {
    gan: p.gan || '',
    zhi: p.zhi || '',
    hideGan: Array.isArray(p.hideGan) ? p.hideGan.join('') : (p.hideGan || ''),
    wuXing: Array.isArray(p.wuXing) ? p.wuXing.join('') : (p.wuXing || ''),
    naYin: p.naYin || '',
    shiShenGan: Array.isArray(p.shiShenGan) ? p.shiShenGan.join('/') : (p.shiShenGan || ''),
    shiShenZhi: Array.isArray(p.shiShenZhi) ? p.shiShenZhi.join('/') : (p.shiShenZhi || ''),
    diShi: Array.isArray(p.diShi) ? p.diShi.join('/') : (p.diShi || ''),
    xun: p.xun || '',
    xunKong: p.xunKong || '',
    hideGanAttr: (p.hideGanAttr || []).map((h: any) => ({
      gan: h.gan || '',
      qiLevel: h.qiLevel || '',
      wuXing: h.wuXing || '',
      shiShen: h.shiShen || '',
    })),
  }
}
