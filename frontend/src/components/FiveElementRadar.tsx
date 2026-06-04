import ReactECharts from 'echarts-for-react'
import type { WuXing } from 'mystilight-8char'

interface Props {
  wuXingPower: Record<WuXing, number>
}

const WU_XING_COLORS: Record<string, string> = {
  '木': '#4a7c59',
  '火': '#c23b22',
  '土': '#b8860b',
  '金': '#c0b283',
  '水': '#2c4a6e',
}

export default function FiveElementRadar({ wuXingPower }: Props) {
  const keys: WuXing[] = ['木', '火', '土', '金', '水']
  const values = keys.map(k => wuXingPower[k] || 0)
  const maxVal = Math.max(...values, 1)

  const option = {
    backgroundColor: 'transparent',
    radar: {
      indicator: keys.map(k => ({
        name: k,
        max: Math.ceil(maxVal * 1.2),
        color: WU_XING_COLORS[k],
      })),
      shape: 'polygon',
      splitNumber: 4,
      axisName: { fontSize: 14, fontWeight: 'bold', fontFamily: 'KaiTi, STKaiti, serif' },
      splitArea: { areaStyle: { color: ['rgba(201,168,76,0.02)', 'rgba(201,168,76,0.05)'] } },
      splitLine: { lineStyle: { color: 'rgba(201,168,76,0.12)' } },
      axisLine: { lineStyle: { color: 'rgba(201,168,76,0.2)' } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: values,
        name: '五行力量',
        areaStyle: { color: 'rgba(201, 168, 76, 0.15)' },
        lineStyle: { color: '#c9a84c', width: 2 },
        itemStyle: { color: '#c9a84c' },
      }],
    }],
  }

  return (
    <div className="panel-traditional p-4">
      <h3 className="text-xs text-gold/70 mb-2 font-heading tracking-wide-cn">五行力量分布</h3>
      <ReactECharts option={option} style={{ height: 260 }} />
      <div className="flex justify-center gap-4 mt-2">
        {keys.map(k => (
          <div key={k} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: WU_XING_COLORS[k] }} />
            <span className="text-[var(--text-secondary)]">{k} {wuXingPower[k] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
