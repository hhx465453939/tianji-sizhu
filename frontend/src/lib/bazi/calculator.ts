import mystilight from 'mystilight-8char'
import type { BaziResult, BaziInput } from './types'

const { getCurrentEightCharJSON } = mystilight as any

const HOUR_TO_TIME: Record<number, number> = {
  0: 23, 1: 1, 2: 3, 3: 5, 4: 7, 5: 9,
  6: 11, 7: 13, 8: 15, 9: 17, 10: 19, 11: 21,
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
    hideGan: p.hideGan || '',
    wuXing: p.wuXing || '',
    naYin: p.naYin || '',
    shiShenGan: p.shiShenGan || '',
    shiShenZhi: p.shiShenZhi || '',
    diShi: p.diShi || '',
    xun: p.xun || '',
    xunKong: p.xunKong || '',
    hideGanAttr: (p.hideGanAttr || []).map((h: any) => ({
      gan: h.gan,
      qiLevel: h.qiLevel,
      wuXing: h.wuXing,
      shiShen: h.shiShen,
    })),
  }
}
