import type { LiuYueItem } from '../lib/bazi/calculator'
import { getNaYin } from '../lib/bazi/calculator'

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
      <h3 className="mb-3 font-heading text-xs tracking-wide-cn text-accent-gold">
        流月 · {targetYear}年
      </h3>

      {/* 12-month grid: 3 columns on phones, 6 on >=sm */}
      <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {liuYueArr.map((my) => {
          const isCurrent = isCurrentYear && my.month === currentMonth
          const isSelected = selectedMonth === my.month
          return (
            <div
              key={my.month}
              onClick={() => onSelectMonth?.(my.month)}
              className={`cursor-pointer rounded-sm border p-2 text-center transition-colors ${
                isSelected
                  ? 'border-accent-gold/60 bg-accent-gold/15 text-accent-gold'
                  : isCurrent
                    ? 'border-accent-jade/40 bg-accent-jade/10 text-accent-jade'
                    : 'border-line-1 hover:border-accent-gold/35 hover:bg-surface-3/60'
              }`}
            >
              <div className="font-ganzhi text-sm font-bold">{my.ganZhi}</div>
              <div className="mt-0.5 text-[10px] text-fg-muted">{getNaYin(my.ganZhi)}</div>
              <div className="text-[10px] text-fg-muted">{MONTH_CN[my.month]}</div>
              <div className="text-[10px] text-fg-3">{my.shiShen}</div>
            </div>
          )
        })}
      </div>

      {/* Selected month detail */}
      {selectedData && (
        <div className="border-t border-line-2 pt-3">
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-xs text-fg-muted">
              {targetYear}年{MONTH_CN[selectedData.month]}
            </span>
            <span className="font-ganzhi text-lg font-bold text-fg-1">{selectedData.ganZhi}</span>
            <span className="text-xs text-fg-muted">{getNaYin(selectedData.ganZhi)}</span>
            <span className="text-xs text-fg-3">{selectedData.shiShen}</span>
          </div>

          {/* Month shensha */}
          {selectedData.liuYueShensha.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedData.liuYueShensha.map((s, i) => (
                <span key={i} className="rounded-sm border-2 border-accent-jade/45 bg-accent-jade/10 px-2 py-0.5 font-heading text-xs text-accent-jade">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-fg-muted">本月无特殊神煞</span>
          )}
        </div>
      )}
    </div>
  )
}
