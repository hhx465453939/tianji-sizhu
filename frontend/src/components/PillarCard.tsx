import type { BaziPillar } from '../lib/bazi/types'

interface Props {
  label: string
  pillar: BaziPillar
}

const WU_XING_BG: Record<string, string> = {
  '木': 'bg-wx-wood/15 border-wx-wood/45',
  '火': 'bg-wx-fire/15 border-wx-fire/45',
  '土': 'bg-wx-earth/15 border-wx-earth/45',
  '金': 'bg-wx-metal/15 border-wx-metal/45',
  '水': 'bg-wx-water/15 border-wx-water/45',
}

function getWuXingStyle(wuXing: string): string {
  const firstChar = wuXing?.charAt(0) || ''
  return WU_XING_BG[firstChar] || 'bg-surface-3 border-line-1'
}

export default function PillarCard({ label, pillar }: Props) {
  return (
    <div className={`corner-deco corner-deco-bottom rounded-sm border-2 p-3 text-center md:p-4 ${getWuXingStyle(pillar.wuXing)}`}>
      <div className="mb-1.5 font-heading text-[11px] tracking-wide-cn text-accent-gold/80 md:mb-2 md:text-xs">
        {label}
      </div>
      <div className="mb-1 text-[11px] text-fg-3 md:text-xs">{pillar.shiShenGan || '—'}</div>
      <div className="mb-1 font-ganzhi text-3xl font-bold leading-none text-fg-1 md:text-4xl">
        {pillar.gan}
      </div>
      <div className="mb-1 font-ganzhi text-xl leading-none text-fg-1 md:text-2xl">{pillar.zhi}</div>
      <div className="text-[11px] text-fg-3 md:text-xs">{pillar.shiShenZhi || '—'}</div>
      <div className="mt-2 text-[11px] text-fg-muted md:text-xs">
        <div>{pillar.naYin}</div>
        <div className="mt-0.5">{pillar.diShi}</div>
      </div>
      {pillar.hideGanAttr && pillar.hideGanAttr.length > 0 && (
        <div className="mt-2 space-y-0.5 border-t border-line-2 pt-2 text-[11px] text-fg-3 md:text-xs">
          {pillar.hideGanAttr.map((h, i) => (
            <div key={i}>{h.gan}（{h.qiLevel}）{h.shiShen}</div>
          ))}
        </div>
      )}
    </div>
  )
}
