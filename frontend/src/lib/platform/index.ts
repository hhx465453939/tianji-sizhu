import type { PlatformAdapter } from './types'
import { wailsAdapter } from './wails'
import { webAdapter } from './web'

export type {
  ChartRecord,
  ChartSummary,
  PlatformAdapter,
  PlatformKind,
  SaveChartInput,
} from './types'

/** True only when the Go binding surface is actually injected by Wails. */
export function isDesktopHost(): boolean {
  if (typeof window === 'undefined') return false
  const go = (window as any).go
  return typeof go?.main?.SaveChart === 'function'
}

/** Resolved once per module load; hosts do not change at runtime. */
export const platform: PlatformAdapter = isDesktopHost() ? wailsAdapter : webAdapter

export const platformKind = platform.kind
