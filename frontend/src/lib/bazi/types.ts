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
  /** Self-sitting 12-life-cycle position */
  ziZuo?: string
  /** Fortune-branch 12-life-cycle position */
  xingYunZhi?: string
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
    startHour: number
    startSolar: string
  }
  dayunArr: DaYunItem[]

  // Current fortune
  currentYun: CurrentYunInfo

  // Relations
  ganRelations: any[]
  zhiRelations: any[]

  // Shensha (神煞)
  shensha: {
    nian: string[]
    yue: string[]
    ri: string[]
    shi: string[]
    current?: { daYun: string[]; liuNian: string[]; liuYue: string[]; liuRi: string[] }
  }

  // Analysis
  analysis: {
    rishi: string[]
    SanMingTongHui: string[]
    XiYongShen: any[]
  }

  // YuanHaiZiping
  yuanHaiZiping: {
    yueLing: any
    taiSui: any
    shenQiang: any
    shidu: any
  }

  // ── NEW: Extended analysis data ──

  /** Spouse appearance analysis */
  spouseAppearance?: any
  /** Family background analysis */
  familyBackground?: any
  /** Self appearance analysis */
  selfAppearance?: any
  /** Education and talent analysis */
  educationAndTalent?: any

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

/** Context for prompt generation: carries user's current UI selections */
export interface PromptContext {
  selectedDaYun?: DaYunItem
  selectedLiuNian?: { year: number; ganZhi: string; ganshen: string; zhishen: string }
  liunianShensha?: {
    daYun: string[]
    liuNian: string[]
  }
  liuYueArr?: { month: number; ganZhi: string; shiShen: string; liuYueShensha: string[] }[]
  selectedLiuYueMonth?: number
  /** Full 10-year liunian data with shensha for comprehensive prompt */
  allLiuNianData?: {
    year: number
    ganZhi: string
    ganshen: string
    zhishen: string
    daYunShensha: string[]
    liuNianShensha: string[]
  }[]
}
