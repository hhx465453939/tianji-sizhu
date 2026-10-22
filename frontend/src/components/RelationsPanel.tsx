interface Props {
  ganRelations: any[]
  zhiRelations: any[]
}

const RELATION_STYLES: Record<string, string> = {
  '合': 'border-accent-jade/55 bg-accent-jade/10 text-accent-jade',
  '冲': 'border-accent-seal/55 bg-accent-seal/10 text-accent-seal',
  '刑': 'border-wx-earth/55 bg-wx-earth/10 text-wx-earth',
  '害': 'border-accent-gold/55 bg-accent-gold/10 text-accent-gold',
  '破': 'border-accent-violet/55 bg-accent-violet/10 text-accent-violet',
  '三合': 'border-accent-jade/55 bg-accent-jade/10 text-accent-jade',
  '六合': 'border-accent-jade/45 bg-accent-jade/8 text-accent-jade',
  '三会': 'border-accent-azure/55 bg-accent-azure/10 text-accent-azure',
}

function getRelationStyle(text: string): string {
  for (const [keyword, style] of Object.entries(RELATION_STYLES)) {
    if (text.includes(keyword)) return style
  }
  return 'border-line-1 bg-surface-3/60 text-fg-2'
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
      <h3 className="mb-3 font-heading text-xs tracking-wide-cn text-accent-gold">刑冲合害</h3>

      {ganRelations.length > 0 && (
        <div className="mb-3 flex flex-wrap items-baseline gap-y-1.5">
          <span className="mr-2 font-heading text-xs text-fg-muted">天干</span>
          <div className="inline-flex flex-wrap gap-1.5">
            {ganRelations.map((r, i) => {
              const text = formatRelation(r)
              return (
                <span key={i} className={`rounded-sm border-2 px-2 py-0.5 font-heading text-xs ${getRelationStyle(text)}`}>
                  {text}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {zhiRelations.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-y-1.5">
          <span className="mr-2 font-heading text-xs text-fg-muted">地支</span>
          <div className="inline-flex flex-wrap gap-1.5">
            {zhiRelations.map((r, i) => {
              const text = formatRelation(r)
              return (
                <span key={i} className={`rounded-sm border-2 px-2 py-0.5 font-heading text-xs ${getRelationStyle(text)}`}>
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
