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
      <h3 className="mb-3 font-heading text-xs tracking-wide-cn text-accent-gold">
        流年 · {dayun.ganZhi}大运 ({dayun.startYear}-{dayun.startYear + 9})
      </h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {dayun.liunianArr.map((ln, i) => {
          const isCurrentYear = ln.year === currentYear
          const isSelected = selectedLiuNianYear !== undefined
            ? ln.year === selectedLiuNianYear
            : isCurrentYear
          return (
            <div
              key={i}
              onClick={() => onSelectLiuNian?.(ln.year)}
              className={`cursor-pointer rounded-sm border p-2 text-center transition-colors ${
                isSelected
                  ? 'border-accent-gold/60 bg-accent-gold/15 text-accent-gold'
                  : isCurrentYear
                    ? 'border-accent-jade/40 bg-accent-jade/10 text-accent-jade'
                    : 'border-line-1 hover:border-accent-gold/35 hover:bg-surface-3/60'
              }`}
            >
              <div className="font-ganzhi text-sm font-bold">{ln.ganZhi}</div>
              <div className="mt-0.5 text-[10px] text-fg-muted">{getNaYin(ln.ganZhi)}</div>
              <div className="text-[10px] text-fg-muted">{ln.year}</div>
              <div className="text-[10px] text-fg-3">{ln.ganshen}/{ln.zhishen}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
