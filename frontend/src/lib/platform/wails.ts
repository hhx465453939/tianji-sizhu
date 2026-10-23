import type {
  ChartRecord,
  ChartSummary,
  PlatformAdapter,
  SaveChartInput,
} from './types'

/**
 * Desktop adapter (Wails + Go + SQLite).
 *
 * Bindings are imported lazily so the web/Android bundle never executes the
 * Wails bridge at module-eval time.
 */
async function bindings() {
  return import('../../../wailsjs/go/main/App')
}

export const wailsAdapter: PlatformAdapter = {
  kind: 'desktop',

  async saveChart(input: SaveChartInput) {
    const { SaveChart } = await bindings()
    return SaveChart(
      input.name || '未命名',
      input.gender,
      input.birthYear,
      input.birthMonth,
      input.birthDay,
      input.birthHour,
      input.calendar,
      input.chartData,
      input.notes ?? '',
    )
  },

  async getChart(id: number) {
    const { GetChart } = await bindings()
    const chart = await GetChart(id)
    return (chart ?? null) as unknown as ChartRecord | null
  },

  async listCharts() {
    const { ListCharts } = await bindings()
    const list = await ListCharts()
    return (list ?? []) as unknown as ChartSummary[]
  },

  async deleteChart(id: number) {
    const { DeleteChart } = await bindings()
    await DeleteChart(id)
  },

  async exportJSON() {
    const { ExportChartsJSON } = await bindings()
    return ExportChartsJSON()
  },

  async copyText(text: string) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        /* blocked on non-secure context */
      }
    }
    try {
      const { CopyToClipboard } = await bindings()
      await CopyToClipboard(text)
      return true
    } catch {
      return false
    }
  },

  async saveFile(filename: string, content: string) {
    try {
      const { SaveFileDialog, WriteFile } = await bindings()
      const path = await SaveFileDialog(filename)
      if (!path) return false
      await WriteFile(path, content)
      return true
    } catch {
      return false
    }
  },

  async startupError() {
    try {
      const { StartupError } = await bindings()
      return (await StartupError()) || ''
    } catch {
      return ''
    }
  },

  async dataDir() {
    try {
      const { DataDir } = await bindings()
      return (await DataDir()) || ''
    } catch {
      return ''
    }
  },
}
