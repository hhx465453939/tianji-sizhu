import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export const DEFAULT_THEME: Theme = 'light'
export const THEME_STORAGE_KEY = 'tianji.theme'

const listeners = new Set<(theme: Theme) => void>()

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

export function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(raw)) return raw
  } catch {
    /* storage may be blocked (private mode / file protocol) */
  }
  return DEFAULT_THEME
}

/** Sync the native window chrome. No-op outside Wails. */
function syncNativeTheme(theme: Theme): void {
  if (typeof window === 'undefined') return
  if (!(window as any).runtime) return
  void (async () => {
    try {
      const runtime = await import('../../../wailsjs/runtime/runtime')
      if (theme === 'dark') runtime.WindowSetDarkTheme()
      else runtime.WindowSetLightTheme()
    } catch {
      /* running in a plain browser / android webview */
    }
  })()
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore quota / blocked storage */
  }
  syncNativeTheme(theme)
  listeners.forEach((fn) => fn(theme))
}

/** Apply the persisted theme before first paint to avoid a flash. */
export function initTheme(): Theme {
  const theme = readStoredTheme()
  applyTheme(theme)
  return theme
}

export function toggleTheme(): Theme {
  const current = typeof document === 'undefined'
    ? DEFAULT_THEME
    : document.documentElement.getAttribute('data-theme')
  const next: Theme = current === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}

export function useTheme(): {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
} {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === 'undefined') return DEFAULT_THEME
    const attr = document.documentElement.getAttribute('data-theme')
    return isTheme(attr) ? attr : DEFAULT_THEME
  })

  useEffect(() => {
    const listener = (next: Theme) => setThemeState(next)
    listeners.add(listener)
    // Keep multiple windows / HMR in sync.
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && isTheme(event.newValue)) {
        applyTheme(event.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const setTheme = useCallback((next: Theme) => applyTheme(next), [])
  const toggle = useCallback(() => { toggleTheme() }, [])

  return { theme, setTheme, toggle }
}
