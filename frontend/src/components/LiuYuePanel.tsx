import type { LiuYueItem } from '../lib/bazi/calculator'

interface Props {
  liuYueArr: LiuYueItem[]
  selectedMonth?: number
  onSelectMonth?: (month: number) => void
  targetYear: number
}

const MONTH_CN = ['', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']

export default function LiuYuePanel({ liuYueArr, selectedMonth, onSelectMonth, targetYear }: Props) {
  if (!liuYueArr || liuYueArr.length === 0) return null

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const isCurrentYear = targetYear === currentYear

  // Get the selected month's data for detailed display
  const selectedData = selectedMonth !== undefined
    ? liuYueArr.find(m => m.month === selectedMonth)
    : null

  return (
    <div className="panel-traditional p-4">
      <h3 className="text-xs text-gold/70 mb-3 font-heading tracking-wide-cn">
        流月 · {targetYear}年
      </h3>

      {/* 12-month grid */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {liuYueArr.map((my) => {
          const isCurrent = isCurrentYear && my.month === currentMonth
          const isSelected = selectedMonth === my.month
          return (
            <div
              key={my.month}
              onClick={() => onSelectMonth?.(my.month)}
              className={`text-center p-2 rounded-sm border transition-colors cursor-pointer ${
                isSelected
                  ? 'border-gold/60 bg-gold/15 text-gold'
                  : isCurrent
                    ? 'border-jade/40 bg-jade/10 text-jade-light'
                    : 'border-bronze/20 hover:bg-ink-700 hover:border-bronze/40'
              }`}
            >
              <div className="text-sm font-bold font-ganzhi">{my.ganZhi}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{MONTH_CN[my.month]}</div>
              <div className="text-[10px] text-[var(--text-tertiary)]">{my.shiShen}</div>
            </div>
          )
        })}
      </div>

      {/* Selected month detail */}
      {selectedData && (
        <div className="border-t border-bronze/20 pt-3">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[var(--text-muted)] text-xs">
              {targetYear}年{MONTH_CN[selectedData.month]}
            </span>
            <span className="text-lg font-bold font-ganzhi text-parchment-100">{selectedData.ganZhi}</span>
            <span className="text-xs text-[var(--text-tertiary)]">{selectedData.shiShen}</span>
          </div>

          {/* Month shensha */}
          {selectedData.liuYueShensha.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedData.liuYueShensha.map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded-sm text-xs border-2 border-jade/40 bg-jade/10 text-jade-light font-heading">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">本月无特殊神煞</span>
          )}
        </div>
      )}
    </div>
  )
}
