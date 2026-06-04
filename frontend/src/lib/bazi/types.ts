import type { WuXing } from 'mystilight-8char'

export interface BaziPillar {
  gan: string
  zhi: string
  hideGan: string
  wuXing: string
  naYin: string
  shiShenGan: string
  shiShenZhi: string
  diShi: string
  xun: string
  xunKong: string
  hideGanAttr: { gan: string; qiLevel: string; wuXing: string; shiShen: string }[]
}

export interface DaYunItem {
  startYear: number
  ganZhi: string
  ganshen: string
  zhishen: string
  startAge?: number
  endAge?: number
  liunianArr: { year: number; ganZhi: string; ganshen: string; zhishen: string }[]
}

export interface CurrentYunInfo {
  daYun: any
  liuNian: any
  xiaoYun: any
  liuYue?: any
  liuRi?: any
}

export interface BaziResult {
  // Basic pillars
  yearGan: string
  yearZhi: string
  monthGan: string
  monthZhi: string
  dayGan: string
  dayZhi: string
  hourGan: string
  hourZhi: string

  // Full pillar objects
  pillars: {
    year: BaziPillar
    month: BaziPillar
    day: BaziPillar
    time: BaziPillar
  }

  // Day master
  dayMaster: string
  dayMasterWuXing: string

  // Special pillars
  taiYuan: string
  taiYuanNaYin: string
  taiXi: string
  taiXiNaYin: string
  mingGong: string
  mingGongNaYin: string
  shenGong: string
  shenGongNaYin: string

  // Five elements power
  wuXingPower: Record<WuXing, number>

  // Fortune (大运)
  yunInfo: {
    gender: string
    forward: boolean
    startYear: number
    startMonth: number
    startDay: number
    startSolar: string
  }
  dayunArr: DaYunItem[]

  // Current fortune
  currentYun: CurrentYunInfo

  // Relations
  ganRelations: any[]
  zhiRelations: any[]

  // Analysis
  analysis: {
    rishi: string[]
    SanMingTongHui: string[]
    XiYongShen: string[]
  }

  // YuanHaiZiping
  yuanHaiZiping: {
    yueLing: any
    taiSui: any
    shenQiang: number
    shidu: number
  }

  // Raw data for export
  rawData: any
}

export interface BaziInput {
  name?: string
  gender: number
  year: number
  month: number
  day: number
  hour: number
  calendar: number
}
