import type { DaYunItem } from '../lib/bazi/types'

interface Props {
  dayunArr: DaYunItem[]
  currentStartYear?: number
  selectedStartYear?: number
  onSelect?: (startYear: number) => void
}

export default function DaYunTimeline({ dayunArr, currentStartYear, selectedStartYear, onSelect }: Props) {
  if (!dayunArr || dayunArr.length === 0) return null

  const currentYear = new Date().getFullYear()

  return (
    <div className="panel-traditional p-4">
      <h3 className="text-xs text-gold/70 mb-3 font-heading tracking-wide-cn">大运</h3>
      <div className="scroll-container p-3">
        <div className="flex gap-0 overflow-x-auto pb-2">
          {dayunArr.filter(dy => dy.ganZhi).map((dy, i) => {
            const isCurrent = currentStartYear
              ? dy.startYear === currentStartYear
              : (dy.startYear <= currentYear && dy.liunianArr?.some(l => l.year >= currentYear))
            const isSelected = selectedStartYear !== undefined
              ? dy.startYear === selectedStartYear
              : isCurrent
            return (
              <div
                key={i}
                onClick={() => onSelect?.(dy.startYear)}
                className={`flex-shrink-0 p-3 text-center min-w-[72px] border-r border-bronze/20 last:border-r-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-ink-600 glow-gold border-gold/50'
                    : isCurrent
                      ? 'border-gold/30 hover:bg-ink-700'
                      : 'hover:bg-ink-700'
                }`}
              >
                <div className={`text-lg font-bold font-ganzhi ${isSelected ? 'text-gold' : 'text-parchment-100'}`}>{dy.ganZhi}</div>
                <div className="text-xs text-[var(--text-tertiary)] mt-1">{dy.ganshen}/{dy.zhishen}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">{dy.startYear}</div>
                {isCurrent && !isSelected && (
                  <div className="text-[10px] text-jade-light mt-0.5">当前</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
