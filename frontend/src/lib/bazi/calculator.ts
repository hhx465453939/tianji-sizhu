import mystilight from 'mystilight-8char'
import type { BaziResult, BaziInput, DaYunItem } from './types'
import { lunarToSolar, solarToLunar } from '../lunar'

const { getCurrentEightCharJSON } = mystilight as any

/**
 * Resolve the effective solar date from a BaziInput.
 * If calendar === 1 (lunar), converts lunar → solar first.
 * Returns the solar date components that should be passed to the calculation engine.
 */
function resolveSolarDate(input: BaziInput, hour: number): { year: number; month: number; day: number } {
  if (input.calendar === 1) {
    try {
      return lunarToSolar(input.year, input.month, input.day, hour, 0, 0)
    } catch (e) {
      console.warn('Lunar to solar conversion failed, falling back to raw input:', e)
      return { year: input.year, month: input.month, day: input.day }
    }
  }
  return { year: input.year, month: input.month, day: input.day }
}

// ── NaYin (纳音) lookup ──────────────────────────────────────────
const GAN = '甲乙丙丁戊己庚辛壬癸'
const ZHI = '子丑寅卯辰巳午未申酉戌亥'

const NA_YIN_30 = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火',
  '涧下水', '城头土', '白蜡金', '杨柳木', '泉中水', '屋上土',
  '霹雳火', '松柏木', '长流水', '沙中金', '山下火', '平地木',
  '壁上土', '金箔金', '覆灯火', '天河水', '大驿土', '钗钏金',
  '桑柘木', '大溪水', '沙中土', '天上火', '石榴木', '大海水',
]

/**
 * Get naYin (纳音) for a ganZhi pair, e.g. '甲子' → '海中金'
 */
export function getNaYin(ganZhi: string): string {
  if (!ganZhi || ganZhi.length < 2) return ''
  const gi = GAN.indexOf(ganZhi[0])
  const zi = ZHI.indexOf(ganZhi[1])
  if (gi < 0 || zi < 0) return ''
  for (let i = 0; i < 60; i++) {
    if (i % 10 === gi && i % 12 === zi) return NA_YIN_30[i >> 1]
  }
  return ''
}

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
  const solar = resolveSolarDate(input, hour)
  const now = new Date()
  const data = getCurrentEightCharJSON({
    year: solar.year,
    month: solar.month,
    day: solar.day,
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
  const solar = resolveSolarDate(input, hour)
  const now = new Date()
  const results: LiuYueItem[] = []

  for (let m = 1; m <= 12; m++) {
    const data = getCurrentEightCharJSON({
      year: solar.year,
      month: solar.month,
      day: solar.day,
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
  const solar = resolveSolarDate(input, hour)

  const data = getCurrentEightCharJSON({
    year: solar.year,
    month: solar.month,
    day: solar.day,
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
      startHour: data.yun.startHour ?? 0,
      startSolar: data.yun.startSolar,
    },
    dayunArr: data.dayunArr || [],

    currentYun: data.currentYun || { daYun: null, liuNian: null, xiaoYun: null },

    ganRelations: data.ganRelations || [],
    zhiRelations: data.zhiRelations || [],

    shensha: data.shensha || { nian: [], yue: [], ri: [], shi: [] },

    analysis: data.analysis || { rishi: [], SanMingTongHui: [], XiYongShen: [] },
    yuanHaiZiping: data.yuanHaiZiping || { yueLing: null, taiSui: null, shenQiang: 0, shidu: 0 },

    // Extended analysis data
    spouseAppearance: data.spouseAppearance || null,
    familyBackground: data.familyBackground || null,
    selfAppearance: data.selfAppearance || null,
    educationAndTalent: data.educationAndTalent || null,

    // Lunar date info (derived from the effective solar date)
    lunarDate: (() => {
      try {
        return solarToLunar(solar.year, solar.month, solar.day, hour, 0, 0)
      } catch {
        return null
      }
    })(),

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
    ziZuo: p.ziZuo || '',
    xingYunZhi: p.xingYunZhi || '',
    hideGanAttr: (p.hideGanAttr || []).map((h: any) => ({
      gan: h.gan || '',
      qiLevel: h.qiLevel || '',
      wuXing: h.wuXing || '',
      shiShen: h.shiShen || '',
    })),
  }
}
