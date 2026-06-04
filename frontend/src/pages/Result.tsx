import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { calculateBazi } from '../lib/bazi/calculator'
import { generatePrompt, getTemplateList } from '../lib/prompt/generator'
import type { PromptTemplate } from '../lib/prompt/generator'
import type { BaziResult, BaziInput } from '../lib/bazi/types'
import PillarCard from '../components/PillarCard'
import FiveElementRadar from '../components/FiveElementRadar'
import DaYunTimeline from '../components/DaYunTimeline'

function Result() {
  const location = useLocation()
  const navigate = useNavigate()
  const [result, setResult] = useState<BaziResult | null>(null)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [template, setTemplate] = useState<PromptTemplate>('comprehensive')
  const input = location.state as BaziInput | null

  useEffect(() => {
    if (!input) {
      navigate('/')
      return
    }
    try {
      const r = calculateBazi(input)
      setResult(r)
    } catch (e: any) {
      setError(e?.message || 'calculation failed')
      console.error('Bazi calculation error:', e)
    }
  }, [input])

  const handleCopyPrompt = async () => {
    if (!result || !input) return
    const prompt = generatePrompt(result, input, template)
    try {
      await navigator.clipboard.writeText(prompt)
    } catch {
      try {
        const { CopyToClipboard } = await import('../../wailsjs/go/main/App')
        await CopyToClipboard(prompt)
      } catch { /* ignore in dev */ }
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    if (!result || !input) return
    try {
      const { SaveChart } = await import('../../wailsjs/go/main/App')
      await SaveChart(
        input.name || '未命名',
        input.gender,
        input.year, input.month, input.day, input.hour,
        input.calendar,
        JSON.stringify(result.rawData),
        ''
      )
      alert('保存成功！')
    } catch (e) {
      console.error('save failed', e)
    }
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
          <p className="text-red-300">排盘计算出错：{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-gray-700 rounded text-sm">返回</button>
        </div>
      </div>
    )
  }

  if (!result) return <div className="p-8 text-center text-gray-400">计算中...</div>

  const currentDaYunStart = result.currentYun?.daYun?.startYear

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">排盘结果</h1>
          {input && (
            <p className="text-gray-400 text-sm mt-1">
              {input.name && `${input.name} · `}
              {input.gender === 0 ? '男' : '女'} · {input.year}年{input.month}月{input.day}日
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
            返回
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm">
            保存
          </button>
        </div>
      </div>

      {/* Four Pillars */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <PillarCard label="年柱" pillar={result.pillars.year} />
        <PillarCard label="月柱" pillar={result.pillars.month} />
        <PillarCard label="日柱" pillar={result.pillars.day} />
        <PillarCard label="时柱" pillar={result.pillars.time} />
      </div>

      {/* Day Master & Special Pillars */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">日主</h3>
          <div className="text-2xl font-bold">{result.dayMaster}（{result.dayMasterWuXing}）</div>
          <div className="text-sm text-gray-400 mt-2">
            身强指数：{result.yuanHaiZiping.shenQiang} | 湿度：{result.yuanHaiZiping.shidu}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">特殊宫位</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>胎元：{result.taiYuan}</div>
            <div>命宫：{result.mingGong}</div>
            <div>胎息：{result.taiXi}</div>
            <div>身宫：{result.shenGong}</div>
          </div>
        </div>
      </div>

      {/* Five Elements Radar */}
      <div className="mb-6">
        <FiveElementRadar wuXingPower={result.wuXingPower} />
      </div>

      {/* DaYun Timeline */}
      <div className="mb-6">
        <DaYunTimeline dayunArr={result.dayunArr} currentStartYear={currentDaYunStart} />
      </div>

      {/* Current Fortune */}
      {result.currentYun?.daYun && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm text-gray-400 mb-2">当前运势</h3>
          <div className="flex gap-6">
            <div>
              <span className="text-gray-500 text-sm">大运：</span>
              <span className="text-lg font-bold">
                {Array.isArray(result.currentYun.daYun.ganZhi)
                  ? result.currentYun.daYun.ganZhi.join('')
                  : result.currentYun.daYun.ganZhi}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                ({result.currentYun.daYun.startYear}-{result.currentYun.daYun.endYear})
              </span>
            </div>
            {result.currentYun.liuNian && (
              <div>
                <span className="text-gray-500 text-sm">流年：</span>
                <span className="text-lg font-bold">
                  {Array.isArray(result.currentYun.liuNian.ganZhi)
                    ? result.currentYun.liuNian.ganZhi.join('')
                    : result.currentYun.liuNian.ganZhi}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({result.currentYun.liuNian.year}年 {result.currentYun.liuNian.age}岁)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysis */}
      {result.analysis.XiYongShen && result.analysis.XiYongShen.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm text-gray-400 mb-2">喜用神</h3>
          <div className="text-sm space-y-1">
            {result.analysis.XiYongShen.map((s, i) => (
              <div key={i}>{s}</div>
            ))}
          </div>
        </div>
      )}

      {/* Gan/Zhi Relations */}
      {(result.ganRelations.length > 0 || result.zhiRelations.length > 0) && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm text-gray-400 mb-2">刑冲合害</h3>
          {result.ganRelations.length > 0 && (
            <div className="mb-2">
              <span className="text-xs text-gray-500">天干：</span>
              <span className="text-sm">{result.ganRelations.map(r => typeof r === 'string' ? r : JSON.stringify(r)).join(' | ')}</span>
            </div>
          )}
          {result.zhiRelations.length > 0 && (
            <div>
              <span className="text-xs text-gray-500">地支：</span>
              <span className="text-sm">{result.zhiRelations.map(r => typeof r === 'string' ? r : JSON.stringify(r)).join(' | ')}</span>
            </div>
          )}
        </div>
      )}

      {/* AI Prompt Section */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-blue-900">
        <h3 className="text-sm text-gray-400 mb-3">AI 命理分析 Prompt</h3>
        <div className="flex gap-2 mb-3 flex-wrap">
          {getTemplateList().map(t => (
            <button
              key={t.key}
              onClick={() => setTemplate(t.key)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                template === t.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopyPrompt}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded font-semibold transition-colors"
        >
          {copied ? '已复制到剪贴板 ✓' : '一键复制 Prompt'}
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          复制后粘贴到 DeepSeek / ChatGPT / Claude 等 AI 对话中即可获得命理解读
        </p>
      </div>
    </div>
  )
}

export default Result
