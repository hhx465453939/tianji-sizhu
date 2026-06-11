import type { DaYunItem } from '../lib/bazi/types'
import { getNaYin } from '../lib/bazi/calculator'

interface Props {
  dayun: DaYunItem
  selectedLiuNianYear?: number
  onSelectLiuNian?: (year: number) => void
}

export default function LiuNianList({ dayun, selectedLiuNianYear, onSelectLiuNian }: Props) {
  if (!dayun.liunianArr || dayun.liunianArr.length === 0) return null

  const currentYear = new Date().getFullYear()

  return (
    <div className="panel-traditional p-4">
      <h3 className="text-xs text-gold/70 mb-3 font-heading tracking-wide-cn">
        流年 · {dayun.ganZhi}大运 ({dayun.startYear}-{dayun.startYear + 9})
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {dayun.liunianArr.map((ln, i) => {
          const isCurrentYear = ln.year === currentYear
          const isSelected = selectedLiuNianYear !== undefined
            ? ln.year === selectedLiuNianYear
            : isCurrentYear
          return (
            <div
              key={i}
              onClick={() => onSelectLiuNian?.(ln.year)}
              className={`text-center p-2 rounded-sm border transition-colors cursor-pointer ${
                isSelected
                  ? 'border-gold/60 bg-gold/15 text-gold'
                  : isCurrentYear
                    ? 'border-jade/40 bg-jade/10 text-jade-light'
                    : 'border-bronze/20 hover:bg-ink-700 hover:border-bronze/40'
              }`}
            >
              <div className="text-sm font-bold font-ganzhi">{ln.ganZhi}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{getNaYin(ln.ganZhi)}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{ln.year}</div>
              <div className="text-[10px] text-[var(--text-tertiary)]">{ln.ganshen}/{ln.zhishen}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
