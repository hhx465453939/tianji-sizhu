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
  '贵人': 'border-gold bg-gold/10 text-gold',
  '桃花': 'border-cinnabar/60 bg-cinnabar/10 text-cinnabar-light',
  '驿马': 'border-water bg-water/10 text-[#6b9bc3]',
  '华盖': 'border-[#7c5cbf] bg-[#7c5cbf]/10 text-[#b69cf0]',
  '将星': 'border-cinnabar bg-cinnabar/15 text-cinnabar-light',
  '禄': 'border-wood bg-wood/10 text-jade-light',
  '羊刃': 'border-cinnabar-dark bg-cinnabar-dark/15 text-cinnabar',
  '福星': 'border-gold bg-gold/10 text-gold-light',
}

function getShenshaStyle(name: string): string {
  for (const [keyword, style] of Object.entries(SHENSHA_COLORS)) {
    if (name.includes(keyword)) return style
  }
  return 'border-bronze/50 bg-bronze/10 text-[var(--text-secondary)]'
}

export default function ShenshaPanel({ shensha }: Props) {
  const hasShensha = PILLAR_LABELS.some(p => shensha[p.key]?.length > 0)
  const hasCurrentShensha = shensha.current &&
    (shensha.current.daYun?.length > 0 || shensha.current.liuNian?.length > 0)

  if (!hasShensha && !hasCurrentShensha) return null

  return (
    <div className="panel-traditional p-4">
      <h3 className="text-xs text-gold/70 mb-3 font-heading tracking-wide-cn">神煞</h3>

      <div className="space-y-2.5 mb-4">
        {PILLAR_LABELS.map(({ key, label }) => {
          const items = shensha[key] || []
          if (items.length === 0) return null
          return (
            <div key={key} className="flex items-start gap-2">
              <span className="text-xs text-[var(--text-muted)] w-10 flex-shrink-0 pt-0.5 font-heading">{label}</span>
              <div className="flex flex-wrap gap-1.5">
                {items.map((s, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded-sm text-xs border-2 font-heading tracking-wide-cn ${getShenshaStyle(s)}`}
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
        <div className="border-t border-bronze/20 pt-3">
          <div className="text-xs text-[var(--text-muted)] mb-2 font-heading">当前运势神煞</div>
          <div className="flex flex-wrap gap-1.5">
            {shensha.current?.daYun?.map((s, i) => (
              <span key={`dy-${i}`} className="px-2 py-0.5 rounded-sm text-xs border-2 border-gold/40 bg-gold/10 text-gold font-heading">
                大运·{s}
              </span>
            ))}
            {shensha.current?.liuNian?.map((s, i) => (
              <span key={`ln-${i}`} className="px-2 py-0.5 rounded-sm text-xs border-2 border-jade/40 bg-jade/10 text-jade-light font-heading">
                流年·{s}
              </span>
            ))}
            {shensha.current?.liuYue?.map((s, i) => (
              <span key={`ly-${i}`} className="px-2 py-0.5 rounded-sm text-xs border-2 border-[#7c5cbf]/40 bg-[#7c5cbf]/10 text-[#b69cf0] font-heading">
                流月·{s}
              </span>
            ))}
            {shensha.current?.liuRi?.map((s, i) => (
              <span key={`lr-${i}`} className="px-2 py-0.5 rounded-sm text-xs border-2 border-water/40 bg-water/10 text-[#6b9bc3] font-heading">
                流日·{s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
