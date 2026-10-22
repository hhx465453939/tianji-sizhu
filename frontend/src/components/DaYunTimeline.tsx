import type { DaYunItem } from '../lib/bazi/types'
import { getNaYin } from '../lib/bazi/calculator'

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
      <h3 className="mb-3 font-heading text-xs tracking-wide-cn text-accent-gold">大运</h3>
      <div className="scroll-container p-2 md:p-3">
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
                className={`min-w-[68px] flex-shrink-0 cursor-pointer border-r border-line-2 p-2 text-center transition-colors last:border-r-0 md:min-w-[72px] md:p-3 ${
                  isSelected
                    ? 'glow-gold border-accent-gold/50 bg-surface-3'
                    : isCurrent
                      ? 'border-accent-gold/30 hover:bg-surface-3/60'
                      : 'hover:bg-surface-3/60'
                }`}
              >
                <div className={`font-ganzhi text-base font-bold md:text-lg ${isSelected ? 'text-accent-gold' : 'text-fg-1'}`}>
                  {dy.ganZhi}
                </div>
                <div className="mt-0.5 text-[10px] text-fg-muted">{getNaYin(dy.ganZhi)}</div>
                <div className="mt-1 text-[11px] text-fg-3">{dy.ganshen}/{dy.zhishen}</div>
                <div className="mt-1 text-[11px] text-fg-muted">{dy.startYear}</div>
                {isCurrent && !isSelected && (
                  <div className="mt-0.5 text-[10px] text-accent-jade">当前</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
