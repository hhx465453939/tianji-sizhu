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
  '贵人': 'border-accent-gold bg-accent-gold/10 text-accent-gold',
  '桃花': 'border-accent-seal/60 bg-accent-seal/10 text-accent-seal',
  '驿马': 'border-accent-azure bg-accent-azure/10 text-accent-azure',
  '华盖': 'border-accent-violet bg-accent-violet/10 text-accent-violet',
  '将星': 'border-accent-seal bg-accent-seal/15 text-accent-seal',
  '禄': 'border-wx-wood bg-wx-wood/10 text-accent-jade',
  '羊刃': 'border-accent-seal bg-accent-seal/15 text-accent-seal',
  '福星': 'border-accent-gold bg-accent-gold/10 text-accent-gold-strong',
}

function getShenshaStyle(name: string): string {
  for (const [keyword, style] of Object.entries(SHENSHA_COLORS)) {
    if (name.includes(keyword)) return style
  }
  return 'border-line-1 bg-surface-3/60 text-fg-2'
}

export default function ShenshaPanel({ shensha }: Props) {
  const hasShensha = PILLAR_LABELS.some(p => shensha[p.key]?.length > 0)
  const hasCurrentShensha = shensha.current &&
    (shensha.current.daYun?.length > 0 || shensha.current.liuNian?.length > 0)

  if (!hasShensha && !hasCurrentShensha) return null

  return (
    <div className="panel-traditional p-4">
      <h3 className="mb-3 font-heading text-xs tracking-wide-cn text-accent-gold">神煞</h3>

      <div className="mb-4 space-y-2.5">
        {PILLAR_LABELS.map(({ key, label }) => {
          const items = shensha[key] || []
          if (items.length === 0) return null
          return (
            <div key={key} className="flex items-start gap-2">
              <span className="w-10 flex-shrink-0 pt-0.5 font-heading text-xs text-fg-muted">{label}</span>
              <div className="flex flex-wrap gap-1.5">
                {items.map((s, i) => (
                  <span
                    key={i}
                    className={`rounded-sm border-2 px-2 py-0.5 font-heading text-xs tracking-wide-cn ${getShenshaStyle(s)}`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {hasCurrentShensha && (
        <div className="border-t border-line-2 pt-3">
          <div className="mb-2 font-heading text-xs text-fg-muted">当前运势神煞</div>
          <div className="flex flex-wrap gap-1.5">
            {shensha.current?.daYun?.map((s, i) => (
              <span key={`dy-${i}`} className="rounded-sm border-2 border-accent-gold/45 bg-accent-gold/10 px-2 py-0.5 font-heading text-xs text-accent-gold">
                大运·{s}
              </span>
            ))}
            {shensha.current?.liuNian?.map((s, i) => (
              <span key={`ln-${i}`} className="rounded-sm border-2 border-accent-jade/45 bg-accent-jade/10 px-2 py-0.5 font-heading text-xs text-accent-jade">
                流年·{s}
              </span>
            ))}
            {shensha.current?.liuYue?.map((s, i) => (
              <span key={`ly-${i}`} className="rounded-sm border-2 border-accent-violet/45 bg-accent-violet/10 px-2 py-0.5 font-heading text-xs text-accent-violet">
                流月·{s}
              </span>
            ))}
            {shensha.current?.liuRi?.map((s, i) => (
              <span key={`lr-${i}`} className="rounded-sm border-2 border-accent-azure/45 bg-accent-azure/10 px-2 py-0.5 font-heading text-xs text-accent-azure">
                流日·{s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
