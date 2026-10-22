import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { calculateBazi, calculateShenshaForDate, calculateLiuYueForYear, calculateDaYunAllLiuNian, getNaYin } from '../lib/bazi/calculator'
import type { LiuYueItem } from '../lib/bazi/calculator'
import { generatePrompt, getTemplateList } from '../lib/prompt/generator'
import type { PromptTemplate } from '../lib/prompt/generator'
import type { BaziResult, BaziInput, DaYunItem, PromptContext } from '../lib/bazi/types'
import PillarCard from '../components/PillarCard'
import FiveElementRadar from '../components/FiveElementRadar'
import DaYunTimeline from '../components/DaYunTimeline'
import LiuNianList from '../components/LiuNianList'
import LiuYuePanel from '../components/LiuYuePanel'
import ShenshaPanel from '../components/ShenshaPanel'
import RelationsPanel from '../components/RelationsPanel'
import DetailedAnalysis from '../components/DetailedAnalysis'
import ThemeToggle from '../components/ThemeToggle'
import { platform } from '../lib/platform'

const sectionTitle = 'mb-2 border-b border-line-1 pb-2 font-heading text-xs tracking-wide-cn text-accent-gold'

function Result() {
  const location = useLocation()
  const navigate = useNavigate()
  const [result, setResult] = useState<BaziResult | null>(null)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
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

    // Batch-calculate all 10 liunian shensha for the selected DaYun (for comprehensive prompt)
    let allLiuNianData: PromptContext['allLiuNianData']
    if (selectedDaYun) {
      try {
        allLiuNianData = calculateDaYunAllLiuNian(input, selectedDaYun)
      } catch (e) {
        console.error('Failed to batch calculate liunian data for prompt', e)
      }
    }

    // Build prompt context from current user selections
    const promptContext: PromptContext = {
      selectedDaYun: selectedDaYun || undefined,
      selectedLiuNian: selectedLiuNian || undefined,
      liunianShensha: liunianShensha?.shensha?.current
        ? { daYun: liunianShensha.shensha.current.daYun || [], liuNian: liunianShensha.shensha.current.liuNian || [] }
        : undefined,
      liuYueArr: liuyueArr.length > 0 ? liuyueArr : undefined,
      selectedLiuYueMonth: selectedLiuYueMonth,
      allLiuNianData,
    }

    const prompt = generatePrompt(result, input, template, promptContext)
    const success = await platform.copyText(prompt)

    setCopied(success)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    if (!result || !input) return
    try {
      await platform.saveChart({
        name: input.name || '未命名',
        gender: input.gender,
        birthYear: input.year,
        birthMonth: input.month,
        birthDay: input.day,
        birthHour: input.hour,
        calendar: input.calendar,
        chartData: JSON.stringify(result.rawData),
        notes: '',
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('save failed', e)
    }
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="panel-traditional border-accent-seal/40 p-4">
          <p className="text-accent-seal">排盘计算出错：{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 rounded-sm border border-line-1 bg-surface-3 px-4 py-2 text-sm text-fg-2"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  if (!result) {
    return <div className="page-shell py-16 text-center text-fg-3">计算中...</div>
  }

  const isViewingCurrent = (selectedDaYunYear ?? currentDaYunStart) === currentDaYunStart

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 md:mb-6">
        <div className="min-w-0">
          <h1 className="font-heading text-lg tracking-wide-cn text-fg-1 md:text-xl">排盘结果</h1>
          {input && (
            <>
              <p className="mt-1 text-sm text-fg-2">
                {input.name && `${input.name} · `}
                {input.gender === 0 ? '男' : '女'} · {input.year}年{input.month}月{input.day}日
                <span className="ml-1 text-fg-muted">（{input.calendar === 0 ? '阳历' : '阴历'}）</span>
              </p>
              {result.lunarDate && (
                <p className="mt-0.5 text-xs text-fg-muted">
                  农历：{result.lunarDate.fullString}
                </p>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle withLabel />
          <button
            onClick={() => navigate('/')}
            className="rounded-sm border border-line-1 bg-surface-3 px-3 py-2 text-sm text-fg-2 transition-colors hover:border-accent-gold/40 hover:text-fg-1 md:px-4"
          >
            返回
          </button>
          <button
            onClick={handleSave}
            className="rounded-sm border border-accent-jade/40 bg-accent-jade/12 px-3 py-2 text-sm text-accent-jade transition-colors hover:bg-accent-jade/20 md:px-4"
          >
            {saved ? '已保存 ✓' : '保存'}
          </button>
        </div>
      </div>

      {/* Four Pillars */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 md:mb-6 md:grid-cols-4 md:gap-3">
        <PillarCard label="年柱" pillar={result.pillars.year} />
        <PillarCard label="月柱" pillar={result.pillars.month} />
        <PillarCard label="日柱" pillar={result.pillars.day} />
        <PillarCard label="时柱" pillar={result.pillars.time} />
      </div>

      {/* Day Master & Special Pillars */}
      <div className="mb-5 grid gap-3 md:mb-6 md:grid-cols-2 md:gap-4">
        <div className="panel-traditional p-4">
          <h3 className={sectionTitle}>日主</h3>
          <div className="font-ganzhi text-xl font-bold text-fg-1 md:text-2xl">
            {result.dayMaster}（{result.dayMasterWuXing}）
          </div>
          <div className="mt-2 text-sm text-fg-2">
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
          <h3 className={sectionTitle}>特殊宫位</h3>
          <div className="grid grid-cols-1 gap-2 text-sm text-fg-2 sm:grid-cols-2">
            <div>胎元：{result.taiYuan}（{result.taiYuanNaYin}）</div>
            <div>命宫：{result.mingGong}（{result.mingGongNaYin}）</div>
            <div>胎息：{result.taiXi}（{result.taiXiNaYin}）</div>
            <div>身宫：{result.shenGong}（{result.shenGongNaYin}）</div>
          </div>
        </div>
      </div>

      {/* Five Elements Radar */}
      <div className="mb-5 md:mb-6">
        <FiveElementRadar wuXingPower={result.wuXingPower} />
      </div>

      {/* Fortune start info */}
      {result.yunInfo.startSolar && (
        <div className="panel-traditional mb-5 p-4 md:mb-6">
          <h3 className={sectionTitle}>起运信息</h3>
          <div className="grid grid-cols-1 gap-2 text-sm text-fg-2 sm:grid-cols-3 sm:gap-4">
            <div>
              <span className="text-fg-muted">排盘方式：</span>
              <span className="text-fg-1">{result.yunInfo.forward ? '顺排' : '逆排'}</span>
            </div>
            <div>
              <span className="text-fg-muted">起运年龄：</span>
              <span className="text-fg-1">{result.yunInfo.startYear}岁{result.yunInfo.startMonth ? ` ${result.yunInfo.startMonth}个月` : ''}</span>
            </div>
            <div>
              <span className="text-fg-muted">起运时间：</span>
              <span className="text-fg-1">{result.yunInfo.startSolar}</span>
            </div>
          </div>
        </div>
      )}

      {/* DaYun Timeline (clickable) */}
      <div className="mb-5 md:mb-6">
        <DaYunTimeline
          dayunArr={result.dayunArr}
          currentStartYear={currentDaYunStart}
          selectedStartYear={selectedDaYunYear ?? currentDaYunStart}
          onSelect={handleDaYunSelect}
        />
      </div>

      {/* LiuNian List for selected DaYun */}
      {selectedDaYun && (
        <div className="mb-5 md:mb-6">
          <LiuNianList
            dayun={selectedDaYun}
            selectedLiuNianYear={selectedLiuNianYear}
            onSelectLiuNian={handleLiuNianSelect}
          />
        </div>
      )}

      {/* Selected DaYun / LiuNian Info */}
      {selectedDaYun && (
        <div className="panel-traditional mb-5 p-4 md:mb-6">
          <h3 className={sectionTitle}>
            {isViewingCurrent ? '当前运势' : '运势详情'}
          </h3>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <div>
              <span className="text-sm text-fg-3">大运：</span>
              <span className="font-ganzhi text-lg font-bold text-fg-1">
                {Array.isArray(selectedDaYun.ganZhi)
                  ? selectedDaYun.ganZhi.join('')
                  : selectedDaYun.ganZhi}
              </span>
              <span className="ml-1 text-xs text-fg-muted">
                {getNaYin(Array.isArray(selectedDaYun.ganZhi) ? selectedDaYun.ganZhi.join('') : selectedDaYun.ganZhi)}
              </span>
              <span className="ml-2 text-xs text-fg-muted">
                ({selectedDaYun.startYear}-{(selectedDaYun.startYear + 9)}年)
              </span>
              <span className="ml-2 text-xs text-fg-3">
                {selectedDaYun.ganshen}/{selectedDaYun.zhishen}
              </span>
            </div>
            {selectedLiuNian && (
              <div>
                <span className="text-sm text-fg-3">流年：</span>
                <span className="font-ganzhi text-lg font-bold text-fg-1">
                  {Array.isArray(selectedLiuNian.ganZhi)
                    ? selectedLiuNian.ganZhi.join('')
                    : selectedLiuNian.ganZhi}
                </span>
                <span className="ml-1 text-xs text-fg-muted">
                  {getNaYin(Array.isArray(selectedLiuNian.ganZhi) ? selectedLiuNian.ganZhi.join('') : selectedLiuNian.ganZhi)}
                </span>
                <span className="ml-2 text-xs text-fg-muted">
                  ({selectedLiuNian.year}年)
                </span>
                <span className="ml-2 text-xs text-fg-3">
                  {selectedLiuNian.ganshen}/{selectedLiuNian.zhishen}
                </span>
              </div>
            )}
          </div>

          {/* DaYun & LiuNian Shensha inline */}
          {displayShensha?.current && (
            <div className="mt-3 border-t border-line-2 pt-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {displayShensha.current.daYun?.map((s, i) => (
                  <span key={`dy-${i}`} className="rounded-sm border-2 border-accent-gold/45 bg-accent-gold/10 px-2 py-0.5 font-heading text-xs text-accent-gold">
                    大运·{s}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {displayShensha.current.liuNian?.map((s, i) => (
                  <span key={`ln-${i}`} className="rounded-sm border-2 border-accent-jade/45 bg-accent-jade/10 px-2 py-0.5 font-heading text-xs text-accent-jade">
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
        <div className="mb-5 md:mb-6">
          {liuyueLoading ? (
            <div className="panel-traditional p-4 text-center text-fg-3">
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
        <div className="panel-traditional mb-5 p-4 md:mb-6">
          <h3 className={sectionTitle}>喜用神</h3>
          <div className="space-y-1 text-sm text-fg-2">
            {result.analysis.XiYongShen.map((s, i) => (
              <div key={i}>{typeof s === 'string' ? s : (s as any)?.judge || JSON.stringify(s)}</div>
            ))}
          </div>
        </div>
      )}

      {/* Shensha Panel - pillar shensha (always shown) */}
      {displayShensha && (
        <div className="mb-5 md:mb-6">
          <ShenshaPanel shensha={displayShensha} />
        </div>
      )}

      {/* Relations Panel */}
      <div className="mb-5 md:mb-6">
        <RelationsPanel ganRelations={result.ganRelations} zhiRelations={result.zhiRelations} />
      </div>

      {/* Detailed Analysis Accordion */}
      <div className="mb-5 md:mb-6">
        <DetailedAnalysis result={result} />
      </div>

      {/* AI Prompt Section */}
      <div className="panel-traditional mb-6 border-accent-gold/35 p-4 md:p-5">
        <h3 className={sectionTitle}>AI 命理分析</h3>
        <div className="mb-4 flex flex-wrap gap-2">
          {getTemplateList().map(t => (
            <button
              key={t.key}
              onClick={() => setTemplate(t.key)}
              className={`rounded-sm border px-2.5 py-1 font-heading text-xs transition-colors md:px-3 ${
                template === t.key
                  ? 'border-accent-gold/55 bg-accent-gold/18 text-accent-gold'
                  : 'border-line-1 bg-surface-3 text-fg-2 hover:border-accent-gold/35 hover:text-fg-1'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopyPrompt}
          className="btn-primary-cn w-full rounded-sm py-3 font-heading tracking-traditional"
        >
          {copied ? '已复制到剪贴板 ✓' : '一键复制 Prompt'}
        </button>
        <p className="mt-3 text-center text-xs text-fg-muted">
          复制后粘贴到 DeepSeek / ChatGPT / Claude 等 AI 对话中即可获得命理解读
        </p>
      </div>
    </div>
  )
}

export default Result
