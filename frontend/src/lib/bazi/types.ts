export interface BaziResult {
  yearStem: string
  yearBranch: string
  monthStem: string
  monthBranch: string
  dayStem: string
  dayBranch: string
  hourStem: string
  hourBranch: string
  dayMasterElement?: string
  tenGods?: string[]
  spirits?: string[]
  luck?: LuckPeriod[]
  fiveElements?: Record<string, number>
  rawData?: any
}

export interface LuckPeriod {
  stem: string
  branch: string
  startAge: number
  endAge: number
}
