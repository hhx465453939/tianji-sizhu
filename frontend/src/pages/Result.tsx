import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { calculateBazi } from '../lib/bazi/calculator'
import { generatePrompt } from '../lib/prompt/generator'
import type { BaziResult } from '../lib/bazi/types'

function Result() {
  const location = useLocation()
  const navigate = useNavigate()
  const [result, setResult] = useState<BaziResult | null>(null)
  const [copied, setCopied] = useState(false)
  const form = location.state as any

  useEffect(() => {
    if (!form) {
      navigate('/')
      return
    }
    const r = calculateBazi(form.year, form.month, form.day, form.hour, form.gender, form.calendar)
    setResult(r)
  }, [form])

  const handleCopyPrompt = async () => {
    if (!result) return
    const prompt = generatePrompt(result, form)
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for Wails
      const { CopyToClipboard } = await import('../../wailsjs/go/main/App')
      await CopyToClipboard(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSave = async () => {
    if (!result || !form) return
    try {
      const { SaveChart } = await import('../../wailsjs/go/main/App')
      await SaveChart(
        form.name || '未命名',
        form.gender,
        form.year, form.month, form.day, form.hour,
        form.calendar,
        JSON.stringify(result),
        ''
      )
      alert('保存成功！')
    } catch (e) {
      console.error('save failed', e)
    }
  }

  if (!result) return <div className="p-8">计算中...</div>

  const pillars = [
    { label: '年柱', stem: result.yearStem, branch: result.yearBranch },
    { label: '月柱', stem: result.monthStem, branch: result.monthBranch },
    { label: '日柱', stem: result.dayStem, branch: result.dayBranch },
    { label: '时柱', stem: result.hourStem, branch: result.hourBranch },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">排盘结果</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-700 rounded text-sm">
            返回
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm">
            保存
          </button>
          <button onClick={handleCopyPrompt} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm">
            {copied ? '已复制 ✓' : '复制 AI Prompt'}
          </button>
        </div>
      </div>

      {form?.name && <p className="text-gray-400 mb-4">{form.name} · {form.gender === 0 ? '男' : '女'} · {form.year}年{form.month}月{form.day}日</p>}

      {/* Four Pillars Display */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {pillars.map(p => (
          <div key={p.label} className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-2">{p.label}</div>
            <div className="text-3xl font-bold mb-1">{p.stem}</div>
            <div className="text-2xl text-gray-300">{p.branch}</div>
          </div>
        ))}
      </div>

      {/* Day Master */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <span className="text-gray-400">日主：</span>
        <span className="text-xl font-bold">{result.dayStem}</span>
        {result.dayMasterElement && <span className="ml-2 text-gray-400">({result.dayMasterElement})</span>}
      </div>

      {/* Ten Gods */}
      {result.tenGods && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm text-gray-400 mb-2">十神</h3>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            {result.tenGods.map((g, i) => (
              <div key={i} className="py-1">{g || '—'}</div>
            ))}
          </div>
        </div>
      )}

      {/* Spirits */}
      {result.spirits && result.spirits.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm text-gray-400 mb-2">神煞</h3>
          <div className="flex flex-wrap gap-2">
            {result.spirits.map((s, i) => (
              <span key={i} className="px-2 py-1 bg-gray-700 rounded text-xs">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Luck periods */}
      {result.luck && result.luck.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm text-gray-400 mb-2">大运</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {result.luck.map((l, i) => (
              <div key={i} className="flex-shrink-0 text-center">
                <div className="text-xs text-gray-500">{l.startAge}岁</div>
                <div className="text-lg font-bold">{l.stem}{l.branch}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Result
