/**
 * Platform-agnostic data contracts.
 *
 * Desktop (Wails + Go + SQLite) and Android/browser (localStorage) must expose
 * the identical shape so that pages never branch on the host.
 */

export interface ChartRecord {
  id: number
  name: string
  gender: number
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number
  calendar: number
  chartData: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface ChartSummary {
  id: number
  name: string
  gender: number
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number
  calendar: number
  createdAt: string
}

export interface SaveChartInput {
  name: string
  gender: number
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number
  calendar: number
  chartData: string
  notes?: string
}

export type PlatformKind = 'desktop' | 'web'

export interface PlatformAdapter {
  readonly kind: PlatformKind
  saveChart(input: SaveChartInput): Promise<number>
  getChart(id: number): Promise<ChartRecord | null>
  listCharts(): Promise<ChartSummary[]>
  deleteChart(id: number): Promise<void>
  exportJSON(): Promise<string>
  copyText(text: string): Promise<boolean>
  saveFile(filename: string, content: string): Promise<boolean>
  /** Non-empty when local persistence is unavailable (desktop). */
  startupError(): Promise<string>
  /** Resolved data directory, for diagnostics display. */
  dataDir(): Promise<string>
}
