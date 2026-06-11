import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { BaziInput } from '../lib/bazi/types'

interface ChartSummary {
  id: number
  name: string
  gender: number
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number
  calendar: number
  createdAt: string
}

function Records() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<ChartSummary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    if (!(window as any)?.go?.main) return
    try {
      const { ListCharts } = await import('../../wailsjs/go/main/App')
      const list = await ListCharts()
      setRecords(list || [])
    } catch (e) {
      console.error('load records failed', e)
    }
  }

  // Click a record to view its chart: fetch full data and navigate to Result
  const handleViewChart = async (id: number) => {
    if (!(window as any)?.go?.main) return
    setLoading(true)
    try {
      const { GetChart } = await import('../../wailsjs/go/main/App')
      const chart = await GetChart(id)
      if (!chart) {
        alert('记录不存在')
        return
      }
      // Build BaziInput from stored birth params and navigate to Result
      const baziInput: BaziInput = {
        name: chart.name,
        gender: chart.gender,
        year: chart.birthYear,
        month: chart.birthMonth,
        day: chart.birthDay,
        hour: chart.birthHour,
        calendar: chart.calendar,
      }
      navigate('/result', { state: baziInput })
    } catch (e) {
      console.error('load chart failed', e)
      alert('加载记录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条记录吗？')) return
    try {
      const { DeleteChart } = await import('../../wailsjs/go/main/App')
      await DeleteChart(id)
      loadRecords()
    } catch (e) {
      console.error('delete failed', e)
    }
  }

  const handleExport = async () => {
    try {
      const { ExportChartsJSON, SaveFileDialog, WriteFile } = await import('../../wailsjs/go/main/App')
      const json = await ExportChartsJSON()
      const path = await SaveFileDialog('tianji-export.json')
      if (path) {
        await WriteFile(path, json)
        alert('导出成功！')
      }
    } catch (e) {
      try {
        const { ExportChartsJSON } = await import('../../wailsjs/go/main/App')
        const json = await ExportChartsJSON()
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'tianji-export.json'
        a.click()
        URL.revokeObjectURL(url)
      } catch (e2) {
        console.error('export failed', e2)
      }
    }
  }

  const filteredRecords = search
    ? records.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : records

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold font-heading text-gold tracking-wide-cn">历史记录</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-4 py-2 bg-gold/15 border border-gold/40 text-gold hover:bg-gold/25 rounded-sm text-sm font-heading transition-colors">
            导出
          </button>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-ink-700 hover:bg-ink-600 border border-bronze/30 rounded-sm text-sm transition-colors">
            返回
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索记录..."
          className="w-full px-4 py-2.5 bg-ink-800 border border-bronze/30 rounded-sm text-parchment-300 placeholder:text-[var(--text-muted)] focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
        />
      </div>

      {filteredRecords.length === 0 ? (
        <p className="text-[var(--text-muted)] text-center py-12">
          {search ? '没有匹配的记录' : '暂无保存记录'}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredRecords.map(r => (
            <div
              key={r.id}
              onClick={() => handleViewChart(r.id)}
              className={`flex justify-between items-center panel-traditional p-4 hover:bg-ink-600 transition-colors cursor-pointer ${
                loading ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <span className="font-heading text-parchment-100">{r.name}</span>
                <span className="ml-2 text-sm text-[var(--text-secondary)]">{r.gender === 0 ? '男' : '女'}</span>
                <span className="ml-3 text-xs text-[var(--text-tertiary)]">
                  {r.birthYear}年{r.birthMonth}月{r.birthDay}日
                </span>
                <span className="ml-4 text-xs text-[var(--text-muted)]">{r.createdAt?.slice(0, 10)}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-jade/70 font-heading">点击查看 →</span>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(r.id) }}
                  className="px-3 py-1 text-cinnabar/70 hover:text-cinnabar text-sm transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-center text-xs text-[var(--text-muted)]">
        共 {filteredRecords.length} 条记录 · 点击记录查看排盘详情
      </div>
    </div>
  )
}

export default Records
