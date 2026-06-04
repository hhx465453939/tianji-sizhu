import type { DaYunItem } from '../lib/bazi/types'

interface Props {
  dayunArr: DaYunItem[]
  currentStartYear?: number
}

export default function DaYunTimeline({ dayunArr, currentStartYear }: Props) {
  if (!dayunArr || dayunArr.length === 0) return null

  const currentYear = new Date().getFullYear()

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm text-gray-400 mb-3">大运</h3>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {dayunArr.map((dy, i) => {
          const isCurrent = currentStartYear
            ? dy.startYear === currentStartYear
            : (dy.startYear <= currentYear && dy.liunianArr?.some(l => l.year >= currentYear))
          return (
            <div
              key={i}
              className={`flex-shrink-0 rounded-lg p-3 text-center min-w-[72px] transition-colors ${
                isCurrent ? 'bg-blue-900 border border-blue-500' : 'bg-gray-700'
              }`}
            >
              <div className="text-lg font-bold">{dy.ganZhi}</div>
              <div className="text-xs text-gray-400 mt-1">{dy.ganshen}/{dy.zhishen}</div>
              <div className="text-xs text-gray-500 mt-1">{dy.startYear}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
