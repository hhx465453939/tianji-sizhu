import { useTheme } from '../lib/theme'

interface Props {
  /** Optional label shown on wider screens. */
  withLabel?: boolean
  className?: string
}

/**
 * Theme switch. Placed in the nav bar and on the immersive result page so the
 * preference stays reachable without leaving the current chart.
 */
export default function ThemeToggle({ withLabel = false, className = '' }: Props) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? '切换到明亮主题' : '切换到暗色主题'

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`flex items-center justify-center gap-1.5 border border-line-1 bg-surface-1 text-fg-2 transition-colors hover:border-accent-gold/60 hover:text-accent-gold ${
        withLabel ? 'h-9 w-9 px-0 md:h-9 md:w-auto md:px-3' : 'h-9 w-9 md:h-8 md:w-8'
      } ${className}`}
    >
      <span className="text-sm leading-none" aria-hidden="true">{isDark ? '☀' : '☾'}</span>
      {withLabel && (
        <span className="hidden text-xs font-heading md:inline">{isDark ? '亮色' : '暗色'}</span>
      )}
      <span className="sr-only">{label}</span>
    </button>
  )
}
