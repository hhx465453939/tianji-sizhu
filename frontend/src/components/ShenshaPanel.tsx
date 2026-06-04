interface Props {
  shensha: {
    nian: string[]
    yue: string[]
    ri: string[]
    shi: string[]
    current?: { daYun: string[]; liuNian: string[]; liuYue: string[]; liuRi: string[] }
  }
}

const PILLAR_LABELS = [
  { key: 'nian', label: '年柱' },
  { key: 'yue', label: '月柱' },
  { key: 'ri', label: '日柱' },
  { key: 'shi', label: '时柱' },
] as const

const SHENSHA_COLORS: Record<string, string> = {
  '贵人': 'bg-yellow-800/60 text-yellow-200 border-yellow-600',
  '桃花': 'bg-pink-800/60 text-pink-200 border-pink-600',
  '驿马': 'bg-blue-800/60 text-blue-200 border-blue-600',
  '华盖': 'bg-purple-800/60 text-purple-200 border-purple-600',
  '将星': 'bg-red-800/60 text-red-200 border-red-600',
  '禄': 'bg-green-800/60 text-green-200 border-green-600',
  '羊刃': 'bg-red-900/60 text-red-300 border-red-700',
}

function getShenshaStyle(name: string): string {
  for (const [keyword, style] of Object.entries(SHENSHA_COLORS)) {
    if (name.includes(keyword)) return style
  }
  return 'bg-gray-700/60 text-gray-200 border-gray-600'
}

export default function ShenshaPanel({ shensha }: Props) {
  const hasShensha = PILLAR_LABELS.some(p => shensha[p.key]?.length > 0)
  const hasCurrentShensha = shensha.current &&
    (shensha.current.daYun?.length > 0 || shensha.current.liuNian?.length > 0)

  if (!hasShensha && !hasCurrentShensha) return null

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm text-gray-400 mb-3">神煞</h3>

      {/* Pillars shensha */}
      <div className="space-y-2 mb-4">
        {PILLAR_LABELS.map(({ key, label }) => {
          const items = shensha[key] || []
          if (items.length === 0) return null
          return (
            <div key={key} className="flex items-start gap-2">
              <span className="text-xs text-gray-500 w-10 flex-shrink-0 pt-1">{label}</span>
              <div className="flex flex-wrap gap-1">
                {items.map((s, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded text-xs border ${getShenshaStyle(s)}`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Current fortune shensha */}
      {hasCurrentShensha && (
        <div className="border-t border-gray-700 pt-3">
          <div className="text-xs text-gray-500 mb-2">当前运势神煞</div>
          <div className="flex flex-wrap gap-1">
            {shensha.current?.daYun?.map((s, i) => (
              <span key={`dy-${i}`} className="px-2 py-0.5 rounded text-xs bg-blue-900/40 text-blue-200 border border-blue-700">
                大运·{s}
              </span>
            ))}
            {shensha.current?.liuNian?.map((s, i) => (
              <span key={`ln-${i}`} className="px-2 py-0.5 rounded text-xs bg-teal-900/40 text-teal-200 border border-teal-700">
                流年·{s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
