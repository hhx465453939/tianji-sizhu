import type { BaziPillar } from '../lib/bazi/types'

interface Props {
  label: string
  pillar: BaziPillar
}

const WU_XING_BG: Record<string, string> = {
  '木': 'bg-wood/10 border-wood/40',
  '火': 'bg-fire/10 border-fire/40',
  '土': 'bg-earth/10 border-earth/40',
  '金': 'bg-metal/10 border-metal/40',
  '水': 'bg-water/10 border-water/40',
}

function getWuXingStyle(wuXing: string): string {
  const firstChar = wuXing?.charAt(0) || ''
  return WU_XING_BG[firstChar] || 'bg-ink-700 border-bronze/30'
}

export default function PillarCard({ label, pillar }: Props) {
  return (
    <div className={`rounded-sm p-4 text-center border-2 corner-deco corner-deco-bottom ${getWuXingStyle(pillar.wuXing)}`}>
      <div className="text-xs text-gold/70 mb-2 font-heading tracking-wide-cn">{label}</div>
      <div className="text-xs text-[var(--text-tertiary)] mb-1">{pillar.shiShenGan || '—'}</div>
      <div className="text-4xl font-bold mb-1 font-ganzhi text-parchment-100">{pillar.gan}</div>
      <div className="text-2xl text-parchment-200 font-ganzhi mb-1">{pillar.zhi}</div>
      <div className="text-xs text-[var(--text-tertiary)]">{pillar.shiShenZhi || '—'}</div>
      <div className="mt-2 text-xs text-[var(--text-muted)]">
        <div>{pillar.naYin}</div>
        <div className="mt-0.5">{pillar.diShi}</div>
      </div>
      {pillar.hideGanAttr && pillar.hideGanAttr.length > 0 && (
        <div className="mt-2 pt-2 border-t border-bronze/20 text-xs text-[var(--text-tertiary)] space-y-0.5">
          {pillar.hideGanAttr.map((h, i) => (
            <div key={i}>{h.gan}（{h.qiLevel}）{h.shiShen}</div>
          ))}
        </div>
      )}
    </div>
  )
}
