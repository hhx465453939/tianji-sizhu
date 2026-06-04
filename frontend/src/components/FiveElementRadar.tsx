import ReactECharts from 'echarts-for-react'
import type { WuXing } from 'mystilight-8char'

interface Props {
  wuXingPower: Record<WuXing, number>
}

const WU_XING_COLORS: Record<string, string> = {
  '木': '#4ade80',
  '火': '#f87171',
  '土': '#fbbf24',
  '金': '#e5e7eb',
  '水': '#60a5fa',
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
      axisName: { fontSize: 14, fontWeight: 'bold' },
      splitArea: { areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'] } },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: values,
        name: '五行力量',
        areaStyle: { color: 'rgba(99, 162, 255, 0.2)' },
        lineStyle: { color: '#63a2ff', width: 2 },
        itemStyle: { color: '#63a2ff' },
      }],
    }],
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm text-gray-400 mb-2">五行力量分布</h3>
      <ReactECharts option={option} style={{ height: 260 }} />
      <div className="flex justify-center gap-4 mt-2">
        {keys.map(k => (
          <div key={k} className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: WU_XING_COLORS[k] }} />
            <span>{k} {wuXingPower[k] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
