import type {
  ChartRecord,
  ChartSummary,
  PlatformAdapter,
  SaveChartInput,
} from './types'

/**
 * Web / Android adapter.
 *
 * Mirrors the desktop SQLite schema field-for-field so exported JSON stays
 * interchangeable between hosts. Storage key is versioned to allow future
 * migrations without clobbering user data.
 */
const STORAGE_KEY = 'tianji.charts.v1'

function readAll(): ChartRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ChartRecord[]) : []
  } catch {
    return []
  }
}

function writeAll(records: ChartRecord[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function nextId(records: ChartRecord[]): number {
  const max = records.reduce((acc, r) => (r.id > acc ? r.id : acc), 0)
  return max + 1
}

function toSummary(r: ChartRecord): ChartSummary {
  return {
    id: r.id,
    name: r.name,
    gender: r.gender,
    birthYear: r.birthYear,
    birthMonth: r.birthMonth,
    birthDay: r.birthDay,
    birthHour: r.birthHour,
    calendar: r.calendar,
    createdAt: r.createdAt,
  }
}

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* insecure context */
    }
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

async function saveFile(filename: string, content: string): Promise<boolean> {
  const blob = new Blob([content], { type: 'application/json' })

  // Prefer the share sheet (Android) so the file lands in Downloads/Drive.
  const file = new File([blob], filename, { type: 'application/json' })
  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean
    share?: (data: { files?: File[]; title?: string }) => Promise<void>
  }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename })
      return true
    } catch {
      /* user cancelled or unsupported */
    }
  }

  try {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 4000)
    return true
  } catch {
    return copyText(content)
  }
}

export const webAdapter: PlatformAdapter = {
  kind: 'web',

  async saveChart(input: SaveChartInput) {
    const records = readAll()
    const now = new Date().toISOString()
    const record: ChartRecord = {
      id: nextId(records),
      name: input.name || '未命名',
      gender: input.gender,
      birthYear: input.birthYear,
      birthMonth: input.birthMonth,
      birthDay: input.birthDay,
      birthHour: input.birthHour,
      calendar: input.calendar,
      chartData: input.chartData,
      notes: input.notes ?? '',
      createdAt: now,
      updatedAt: now,
    }
    records.push(record)
    writeAll(records)
    return record.id
  },

  async getChart(id: number) {
    return readAll().find(r => r.id === id) ?? null
  },

  async listCharts() {
    return readAll()
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map(toSummary)
  },

  async deleteChart(id: number) {
    writeAll(readAll().filter(r => r.id !== id))
  },

  async exportJSON() {
    return JSON.stringify(readAll(), null, 2)
  },

  copyText,
  saveFile,

  // A browser/Android host always has a working store, so there is no startup
  // failure to report; the data lives in localStorage.
  async startupError() {
    return ''
  },

  async dataDir() {
    return 'localStorage'
  },
}
