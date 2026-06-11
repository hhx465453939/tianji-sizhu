import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { calculateBazi, calculateShenshaForDate, calculateLiuYueForYear } from '../lib/bazi/calculator'
import type { LiuYueItem } from '../lib/bazi/calculator'
import { generatePrompt, getTemplateList } from '../lib/prompt/generator'
import type { PromptTemplate } from '../lib/prompt/generator'
import type { BaziResult, BaziInput, DaYunItem } from '../lib/bazi/types'
import PillarCard from '../components/PillarCard'
import FiveElementRadar from '../components/FiveElementRadar'
import DaYunTimeline from '../components/DaYunTimeline'
import LiuNianList from '../components/LiuNianList'
import LiuYuePanel from '../components/LiuYuePanel'
import ShenshaPanel from '../components/ShenshaPanel'
import RelationsPanel from '../components/RelationsPanel'

function Result() {
  const location = useLocation()
  const navigate = useNavigate()
  const [result, setResult] = useState<BaziResult | null>(null)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [template, setTemplate] = useState<PromptTemplate>('comprehensive')

  // DaYun / LiuNian selection state
  const [selectedDaYunYear, setSelectedDaYunYear] = useState<number | undefined>(undefined)
  const [selectedLiuNianYear, setSelectedLiuNianYear] = useState<number | undefined>(undefined)
  const [selectedLiuYueMonth, setSelectedLiuYueMonth] = useState<number | undefined>(undefined)

  // Shensha for selected LiuNian
  const [liunianShensha, setLiunianShensha] = useState<{
    shensha: BaziResult['shensha']
    currentYun: BaziResult['currentYun']
  } | null>(null)

  // 12 months data for selected LiuNian
  const [liuyueArr, setLiuyueArr] = useState<LiuYueItem[]>([])
  const [liuyueLoading, setLiuyueLoading] = useState(false)

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

  // The current DaYun start year from calculation
  const currentDaYunStart = result?.currentYun?.daYun?.startYear

  // Resolve the selected DaYun item
  const selectedDaYun: DaYunItem | null = useMemo(() => {
    if (!result?.dayunArr) return null
    const year = selectedDaYunYear ?? currentDaYunStart
    if (year === undefined) return null
    return result.dayunArr.find(dy => dy.startYear === year) || null
  }, [result?.dayunArr, selectedDaYunYear, currentDaYunStart])

  // Resolve selected LiuNian
  const selectedLiuNian = useMemo(() => {
    if (!selectedDaYun?.liunianArr) return null
    if (selectedLiuNianYear !== undefined) {
      return selectedDaYun.liunianArr.find(ln => ln.year === selectedLiuNianYear) || null
    }
    // Default to current year
    const currentYear = new Date().getFullYear()
    return selectedDaYun.liunianArr.find(ln => ln.year === currentYear) || null
  }, [selectedDaYun, selectedLiuNianYear])

  // When selectedLiuNianYear changes, recalculate shensha + all 12 liuYue
  useEffect(() => {
    if (!input || !result) return
    const targetYear = selectedLiuNian?.year ?? new Date().getFullYear()
    if (!selectedLiuNian) return

    // Reset month selection
    setSelectedLiuYueMonth(undefined)

    // Calculate shensha for the year
    try {
      const data = calculateShenshaForDate(input, targetYear)
      setLiunianShensha(data)
    } catch (e) {
      console.error('Failed to calculate shensha for year', targetYear, e)
      setLiunianShensha(null)
    }

    // Calculate all 12 months
    setLiuyueLoading(true)
    // Use setTimeout to avoid blocking UI
    const timer = setTimeout(() => {
      try {
        const months = calculateLiuYueForYear(input, targetYear)
        setLiuyueArr(months)
        // Auto-select current month if viewing current year
        const currentYear = new Date().getFullYear()
        if (targetYear === currentYear) {
          setSelectedLiuYueMonth(new Date().getMonth() + 1)
        }
      } catch (e) {
        console.error('Failed to calculate liuYue for year', targetYear, e)
        setLiuyueArr([])
      } finally {
        setLiuyueLoading(false)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [input, result, selectedLiuNian])

  // Build the complete shensha display: pillar shensha + current period shensha
  const displayShensha = useMemo(() => {
    if (!result?.shensha) return undefined
    const base = { ...result.shensha }

    if (liunianShensha?.shensha?.current) {
      return { ...base, current: liunianShensha.shensha.current }
    }

    const effectiveDaYunYear = selectedDaYunYear ?? currentDaYunStart
    if (effectiveDaYunYear !== currentDaYunStart) {
      return { ...base, current: undefined }
    }

    return base
  }, [result?.shensha, liunianShensha, selectedDaYunYear, currentDaYunStart])

  const handleDaYunSelect = useCallback((startYear: number) => {
    setSelectedDaYunYear(startYear)
    setSelectedLiuNianYear(undefined)
    setSelectedLiuYueMonth(undefined)
    setLiuyueArr([])
  }, [])

  const handleLiuNianSelect = useCallback((year: number) => {
    setSelectedLiuNianYear(year)
  }, [])

  const handleLiuYueSelect = useCallback((month: number) => {
    setSelectedLiuYueMonth(month)
  }, [])

  const handleCopyPrompt = async () => {
    if (!result || !input) return
    const prompt = generatePrompt(result, input, template)
    let success = false

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(prompt)
        success = true
      } catch { /* blocked on non-secure context */ }
    }

    if (!success && (window as any)?.go?.main) {
      try {
        const { CopyToClipboard } = await import('../../wailsjs/go/main/App')
        await CopyToClipboard(prompt)
        success = true
      } catch { /* Wails not available */ }
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = prompt
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        success = true
      } catch { /* last resort failed */ }
    }

    setCopied(success)
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
        <div className="panel-traditional p-4 border-cinnabar/40">
          <p className="text-cinnabar-light">排盘计算出错：{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-ink-700 border border-bronze/30 rounded-sm text-sm">返回</button>
        </div>
      </div>
    )
  }

  if (!result) return <div className="p-8 text-center text-[var(--text-secondary)]">计算中...</div>

  const isViewingCurrent = (selectedDaYunYear ?? currentDaYunStart) === currentDaYunStart

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold font-heading text-gold tracking-wide-cn">排盘结果</h1>
          {input && (
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              {input.name && `${input.name} · `}
              {input.gender === 0 ? '男' : '女'} · {input.year}年{input.month}月{input.day}日
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-ink-700 hover:bg-ink-600 border border-bronze/30 rounded-sm text-sm transition-colors">
            返回
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-jade-dark hover:bg-jade border border-jade/30 rounded-sm text-sm transition-colors">
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
        <div className="panel-traditional p-4">
          <h3 className="text-xs text-gold/70 mb-2 font-heading tracking-wide-cn border-b border-bronze/20 pb-2">日主</h3>
          <div className="text-2xl font-bold font-ganzhi text-parchment-100">{result.dayMaster}（{result.dayMasterWuXing}）</div>
          <div className="text-sm text-[var(--text-secondary)] mt-2">
            {typeof result.yuanHaiZiping.shenQiang === 'object'
              ? `${result.yuanHaiZiping.shenQiang.judge}（得分：${result.yuanHaiZiping.shenQiang.score}）`
              : `身强指数：${result.yuanHaiZiping.shenQiang}`}
            {' | '}
            {typeof result.yuanHaiZiping.shidu === 'object'
              ? `${result.yuanHaiZiping.shidu.judge}（寒暖：${result.yuanHaiZiping.shidu.score}）`
              : `湿度：${result.yuanHaiZiping.shidu}`}
          </div>
        </div>
        <div className="panel-traditional p-4">
          <h3 className="text-xs text-gold/70 mb-2 font-heading tracking-wide-cn border-b border-bronze/20 pb-2">特殊宫位</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-[var(--text-secondary)]">
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

      {/* DaYun Timeline (clickable) */}
      <div className="mb-6">
        <DaYunTimeline
          dayunArr={result.dayunArr}
          currentStartYear={currentDaYunStart}
          selectedStartYear={selectedDaYunYear ?? currentDaYunStart}
          onSelect={handleDaYunSelect}
        />
      </div>

      {/* LiuNian List for selected DaYun */}
      {selectedDaYun && (
        <div className="mb-6">
          <LiuNianList
            dayun={selectedDaYun}
            selectedLiuNianYear={selectedLiuNianYear}
            onSelectLiuNian={handleLiuNianSelect}
          />
        </div>
      )}

      {/* Selected DaYun / LiuNian Info */}
      {selectedDaYun && (
        <div className="panel-traditional p-4 mb-6">
          <h3 className="text-xs text-gold/70 mb-2 font-heading tracking-wide-cn border-b border-bronze/20 pb-2">
            {isViewingCurrent ? '当前运势' : '运势详情'}
          </h3>
          <div className="flex gap-6 flex-wrap">
            <div>
              <span className="text-[var(--text-tertiary)] text-sm">大运：</span>
              <span className="text-lg font-bold font-ganzhi text-parchment-100">
                {Array.isArray(selectedDaYun.ganZhi)
                  ? selectedDaYun.ganZhi.join('')
                  : selectedDaYun.ganZhi}
              </span>
              <span className="text-xs text-[var(--text-muted)] ml-2">
                ({selectedDaYun.startYear}-{(selectedDaYun.startYear + 9)}年)
              </span>
              <span className="text-xs text-[var(--text-tertiary)] ml-2">
                {selectedDaYun.ganshen}/{selectedDaYun.zhishen}
              </span>
            </div>
            {selectedLiuNian && (
              <div>
                <span className="text-[var(--text-tertiary)] text-sm">流年：</span>
                <span className="text-lg font-bold font-ganzhi text-parchment-100">
                  {Array.isArray(selectedLiuNian.ganZhi)
                    ? selectedLiuNian.ganZhi.join('')
                    : selectedLiuNian.ganZhi}
                </span>
                <span className="text-xs text-[var(--text-muted)] ml-2">
                  ({selectedLiuNian.year}年)
                </span>
                <span className="text-xs text-[var(--text-tertiary)] ml-2">
                  {selectedLiuNian.ganshen}/{selectedLiuNian.zhishen}
                </span>
              </div>
            )}
          </div>

          {/* DaYun & LiuNian Shensha inline */}
          {displayShensha?.current && (
            <div className="mt-3 border-t border-bronze/20 pt-3">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {displayShensha.current.daYun?.map((s, i) => (
                  <span key={`dy-${i}`} className="px-2 py-0.5 rounded-sm text-xs border-2 border-gold/40 bg-gold/10 text-gold font-heading">
                    大运·{s}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {displayShensha.current.liuNian?.map((s, i) => (
                  <span key={`ln-${i}`} className="px-2 py-0.5 rounded-sm text-xs border-2 border-jade/40 bg-jade/10 text-jade-light font-heading">
                    流年·{s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* LiuYue Panel - 12 months grid with shensha on click */}
      {selectedLiuNian && (
        <div className="mb-6">
          {liuyueLoading ? (
            <div className="panel-traditional p-4 text-center text-[var(--text-secondary)]">
              计算流月中...
            </div>
          ) : (
            <LiuYuePanel
              liuYueArr={liuyueArr}
              selectedMonth={selectedLiuYueMonth}
              onSelectMonth={handleLiuYueSelect}
              targetYear={selectedLiuNian.year}
            />
          )}
        </div>
      )}

      {/* Analysis */}
      {result.analysis.XiYongShen && result.analysis.XiYongShen.length > 0 && (
        <div className="panel-traditional p-4 mb-6">
          <h3 className="text-xs text-gold/70 mb-2 font-heading tracking-wide-cn border-b border-bronze/20 pb-2">喜用神</h3>
          <div className="text-sm space-y-1 text-[var(--text-secondary)]">
            {result.analysis.XiYongShen.map((s, i) => (
              <div key={i}>{typeof s === 'string' ? s : (s as any)?.judge || JSON.stringify(s)}</div>
            ))}
          </div>
        </div>
      )}

      {/* Shensha Panel - pillar shensha (always shown) */}
      {displayShensha && (
        <div className="mb-6">
          <ShenshaPanel shensha={displayShensha} />
        </div>
      )}

      {/* Relations Panel */}
      <div className="mb-6">
        <RelationsPanel ganRelations={result.ganRelations} zhiRelations={result.zhiRelations} />
      </div>

      {/* AI Prompt Section */}
      <div className="panel-traditional p-5 mb-6 border-gold/30">
        <h3 className="text-xs text-gold/70 mb-3 font-heading tracking-wide-cn border-b border-bronze/20 pb-2">AI 命理分析</h3>
        <div className="flex gap-2 mb-4 flex-wrap">
          {getTemplateList().map(t => (
            <button
              key={t.key}
              onClick={() => setTemplate(t.key)}
              className={`px-3 py-1 rounded-sm text-xs font-heading transition-colors ${
                template === t.key
                  ? 'bg-gold/20 text-gold border border-gold/50'
                  : 'bg-ink-700 text-[var(--text-secondary)] border border-bronze/20 hover:bg-ink-600 hover:text-parchment-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopyPrompt}
          className="w-full py-3 btn-primary-cn rounded-sm font-heading tracking-traditional"
        >
          {copied ? '已复制到剪贴板 ✓' : '一键复制 Prompt'}
        </button>
        <p className="text-xs text-[var(--text-muted)] mt-3 text-center">
          复制后粘贴到 DeepSeek / ChatGPT / Claude 等 AI 对话中即可获得命理解读
        </p>
      </div>
    </div>
  )
}

export default Result
