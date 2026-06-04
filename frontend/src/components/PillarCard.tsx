import type { BaziPillar } from '../lib/bazi/types'

interface Props {
  label: string
  pillar: BaziPillar
}

const WU_XING_BG: Record<string, string> = {
  '木': 'bg-green-900/40 border-green-700',
  '火': 'bg-red-900/40 border-red-700',
  '土': 'bg-yellow-900/40 border-yellow-700',
  '金': 'bg-gray-600/40 border-gray-500',
  '水': 'bg-blue-900/40 border-blue-700',
}

function getWuXingStyle(wuXing: string): string {
  const firstChar = wuXing?.charAt(0) || ''
  return WU_XING_BG[firstChar] || 'bg-gray-700 border-gray-600'
}

export default function PillarCard({ label, pillar }: Props) {
  const ganWuXing = pillar.wuXing?.split('')?.[0] || ''
  const zhiWuXing = pillar.wuXing?.split('')?.[1] || ''

  return (
    <div className={`rounded-lg p-4 text-center border ${getWuXingStyle(pillar.wuXing)}`}>
      <div className="text-xs text-gray-400 mb-2">{label}</div>
      <div className="text-sm text-gray-500 mb-1">{pillar.shiShenGan || '—'}</div>
      <div className="text-3xl font-bold mb-1">{pillar.gan}</div>
      <div className="text-2xl text-gray-300 mb-1">{pillar.zhi}</div>
      <div className="text-sm text-gray-500">{pillar.shiShenZhi || '—'}</div>
      <div className="mt-2 text-xs text-gray-500">
        <div>{pillar.naYin}</div>
        <div className="mt-1">{pillar.diShi}</div>
      </div>
      {pillar.hideGanAttr && pillar.hideGanAttr.length > 0 && (
        <div className="mt-2 text-xs text-gray-400 space-y-0.5">
          {pillar.hideGanAttr.map((h, i) => (
            <div key={i}>{h.gan}({h.qiLevel}) {h.shiShen}</div>
          ))}
        </div>
      )}
    </div>
  )
}
