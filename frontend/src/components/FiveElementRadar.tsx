import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { WuXing } from 'mystilight-8char'
import { useTheme } from '../lib/theme'

interface Props {
  wuXingPower: Record<WuXing, number>
}

const KEYS: WuXing[] = ['木', '火', '土', '金', '水']

const WX_VARS: Record<string, string> = {
  '木': '--wx-wood',
  '火': '--wx-fire',
  '土': '--wx-earth',
  '金': '--wx-metal',
  '水': '--wx-water',
}

/** Read a CSS channel trio (e.g. "74 122 92") and compose a color string. */
function readChannel(name: string, fallback: string, alpha = 1): string {
  if (typeof window === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!raw) return fallback
  return alpha >= 1 ? `rgb(${raw})` : `rgb(${raw} / ${alpha})`
}

export default function FiveElementRadar({ wuXingPower }: Props) {
  const { theme } = useTheme()
  const values = useMemo(() => KEYS.map(k => wuXingPower[k] || 0), [wuXingPower])
  const maxVal = Math.max(...values, 1)

  const option = useMemo(() => {
    const colors = KEYS.map(k => readChannel(WX_VARS[k], '#8B7355'))
    const gridLine = readChannel('--line-1', 'rgba(0,0,0,0.12)', 0.9)
    const gold = readChannel('--accent-gold', '#A8822C')
    const goldFill = readChannel('--accent-gold', '#A8822C', 0.16)
    const isLight = theme === 'light'
    return {
      backgroundColor: 'transparent',
      radar: {
        indicator: KEYS.map(k => ({
          name: k,
          max: Math.ceil(maxVal * 1.2),
          color: colors[KEYS.indexOf(k)],
        })),
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          fontSize: 13,
          fontWeight: 'bold' as const,
          fontFamily: 'KaiTi, STKaiti, serif',
        },
        splitArea: {
          areaStyle: {
            color: isLight
              ? ['rgb(255 255 255 / 0.35)', 'rgb(62 46 28 / 0.03)']
              : ['rgb(255 255 255 / 0.02)', 'rgb(255 255 255 / 0.045)'],
          },
        },
        splitLine: { lineStyle: { color: gridLine, opacity: isLight ? 0.65 : 0.55 } },
        axisLine: { lineStyle: { color: gridLine, opacity: isLight ? 0.75 : 0.65 } },
      },
      series: [{
        type: 'radar',
        data: [{
          value: values,
          name: '五行力量',
          areaStyle: { color: goldFill },
          lineStyle: { color: gold, width: 2 },
          itemStyle: { color: gold },
        }],
      }],
    }
  }, [theme, maxVal, values])

  return (
    <div className="panel-traditional p-4">
      <h3 className="mb-2 font-heading text-xs tracking-wide-cn text-accent-gold">五行力量分布</h3>
      <div className="mx-auto w-full max-w-md">
        <ReactECharts option={option} style={{ height: 260 }} notMerge />
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {KEYS.map(k => (
            <div key={k} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: readChannel(WX_VARS[k], '#8B7355') }}
                aria-hidden="true"
              />
              <span className="text-fg-2">{k} {wuXingPower[k] || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
