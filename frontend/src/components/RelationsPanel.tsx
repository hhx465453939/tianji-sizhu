interface Props {
  ganRelations: any[]
  zhiRelations: any[]
}

const RELATION_STYLES: Record<string, string> = {
  '合': 'bg-green-900/50 border-green-600 text-green-200',
  '冲': 'bg-red-900/50 border-red-600 text-red-200',
  '刑': 'bg-orange-900/50 border-orange-600 text-orange-200',
  '害': 'bg-yellow-900/50 border-yellow-600 text-yellow-200',
  '破': 'bg-purple-900/50 border-purple-600 text-purple-200',
  '三合': 'bg-emerald-900/50 border-emerald-600 text-emerald-200',
  '六合': 'bg-green-900/50 border-green-600 text-green-200',
  '三会': 'bg-cyan-900/50 border-cyan-600 text-cyan-200',
}

function getRelationStyle(text: string): string {
  for (const [keyword, style] of Object.entries(RELATION_STYLES)) {
    if (text.includes(keyword)) return style
  }
  return 'bg-gray-700/50 border-gray-600 text-gray-200'
}

function formatRelation(r: any): string {
  if (typeof r === 'string') return r
  if (r.description) return r.description
  if (r.type && r.items) return `${r.items.join('')}${r.type}`
  return JSON.stringify(r)
}

export default function RelationsPanel({ ganRelations, zhiRelations }: Props) {
  if (ganRelations.length === 0 && zhiRelations.length === 0) return null

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm text-gray-400 mb-3">刑冲合害</h3>

      {ganRelations.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-gray-500 mr-2">天干</span>
          <div className="inline-flex flex-wrap gap-1">
            {ganRelations.map((r, i) => {
              const text = formatRelation(r)
              return (
                <span key={i} className={`px-2 py-0.5 rounded text-xs border ${getRelationStyle(text)}`}>
                  {text}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {zhiRelations.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 mr-2">地支</span>
          <div className="inline-flex flex-wrap gap-1">
            {zhiRelations.map((r, i) => {
              const text = formatRelation(r)
              return (
                <span key={i} className={`px-2 py-0.5 rounded text-xs border ${getRelationStyle(text)}`}>
                  {text}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
