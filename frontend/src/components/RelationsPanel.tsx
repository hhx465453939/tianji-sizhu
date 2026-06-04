interface Props {
  ganRelations: any[]
  zhiRelations: any[]
}

const RELATION_STYLES: Record<string, string> = {
  '合': 'border-jade/60 bg-jade/10 text-jade-light',
  '冲': 'border-cinnabar/60 bg-cinnabar/10 text-cinnabar-light',
  '刑': 'border-earth/60 bg-earth/10 text-[#d4a017]',
  '害': 'border-gold-dark/60 bg-gold-dark/10 text-gold',
  '破': 'border-[#7c5cbf]/60 bg-[#7c5cbf]/10 text-[#b69cf0]',
  '三合': 'border-jade/60 bg-jade/10 text-jade-light',
  '六合': 'border-jade/50 bg-jade/8 text-jade',
  '三会': 'border-water/60 bg-water/10 text-[#6b9bc3]',
}

function getRelationStyle(text: string): string {
  for (const [keyword, style] of Object.entries(RELATION_STYLES)) {
    if (text.includes(keyword)) return style
  }
  return 'border-bronze/50 bg-bronze/10 text-[var(--text-secondary)]'
}

function formatRelation(r: any): string {
  if (typeof r === 'string') return r
  if (r.desc) return r.desc
  if (r.description) return r.description
  if (r.type && r.items) return `${r.items.join('')}${r.type}`
  return JSON.stringify(r)
}

export default function RelationsPanel({ ganRelations, zhiRelations }: Props) {
  if (ganRelations.length === 0 && zhiRelations.length === 0) return null

  return (
    <div className="panel-traditional p-4">
      <h3 className="text-xs text-gold/70 mb-3 font-heading tracking-wide-cn">刑冲合害</h3>

      {ganRelations.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-[var(--text-muted)] mr-2 font-heading">天干</span>
          <div className="inline-flex flex-wrap gap-1.5">
            {ganRelations.map((r, i) => {
              const text = formatRelation(r)
              return (
                <span key={i} className={`px-2 py-0.5 rounded-sm text-xs border-2 font-heading ${getRelationStyle(text)}`}>
                  {text}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {zhiRelations.length > 0 && (
        <div>
          <span className="text-xs text-[var(--text-muted)] mr-2 font-heading">地支</span>
          <div className="inline-flex flex-wrap gap-1.5">
            {zhiRelations.map((r, i) => {
              const text = formatRelation(r)
              return (
                <span key={i} className={`px-2 py-0.5 rounded-sm text-xs border-2 font-heading ${getRelationStyle(text)}`}>
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
