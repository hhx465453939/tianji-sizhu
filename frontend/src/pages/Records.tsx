import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { BaziInput } from '../lib/bazi/types'
import { platform } from '../lib/platform'
import type { ChartSummary } from '../lib/platform'

function Records() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<ChartSummary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [exported, setExported] = useState<'idle' | 'ok' | 'fail'>('idle')

  const loadRecords = useCallback(async () => {
    try {
      const list = await platform.listCharts()
      setRecords(list || [])
    } catch (e) {
      console.error('load records failed', e)
    }
  }, [])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  const handleViewChart = async (id: number) => {
    setLoading(true)
    try {
      const chart = await platform.getChart(id)
      if (!chart) {
        alert('记录不存在')
        return
      }
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
      await platform.deleteChart(id)
      await loadRecords()
    } catch (e) {
      console.error('delete failed', e)
    }
  }

  const handleExport = async () => {
    try {
      const json = await platform.exportJSON()
      const stamp = new Date().toISOString().slice(0, 10)
      const ok = await platform.saveFile(`tianji-export-${stamp}.json`, json)
      setExported(ok ? 'ok' : 'fail')
      if (!ok) await platform.copyText(json)
      setTimeout(() => setExported('idle'), 2600)
    } catch (e) {
      console.error('export failed', e)
      setExported('fail')
      setTimeout(() => setExported('idle'), 2600)
    }
  }

  const filteredRecords = search
    ? records.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()))
    : records

  return (
    <div className="page-shell">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 md:mb-6">
        <h1 className="font-heading text-lg tracking-wide-cn text-fg-1 md:text-xl">历史记录</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={records.length === 0}
            className="rounded-sm border border-accent-gold/45 bg-accent-gold/10 px-3 py-2 font-heading text-sm text-accent-gold transition-colors hover:bg-accent-gold/18 disabled:cursor-not-allowed disabled:border-line-1 disabled:bg-transparent disabled:text-fg-muted md:px-4"
          >
            {exported === 'ok' ? '已导出 ✓' : exported === 'fail' ? '已复制内容' : '导出'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="rounded-sm border border-line-1 bg-surface-3 px-3 py-2 text-sm text-fg-2 transition-colors hover:border-accent-gold/40 hover:text-fg-1 md:px-4"
          >
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
          className="w-full rounded-sm border border-line-1 bg-surface-1 px-3 py-2.5 text-fg-1 transition-colors focus:border-accent-gold focus:outline-none focus:ring-1 focus:ring-accent-gold/25"
        />
      </div>

      {filteredRecords.length === 0 ? (
        <div className="panel-traditional flex flex-col items-center gap-2 px-4 py-14 text-center">
          <p className="text-sm text-fg-3">{search ? '没有匹配的记录' : '暂无保存记录'}</p>
          {!search && (
            <button
              onClick={() => navigate('/')}
              className="mt-1 text-xs text-accent-seal hover:underline"
            >
              去排一张盘 →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRecords.map(r => (
            <div
              key={r.id}
              onClick={() => handleViewChart(r.id)}
              className={`panel-traditional flex cursor-pointer flex-col gap-2 px-3 py-3 transition-colors hover:border-accent-gold/45 sm:flex-row sm:items-center sm:justify-between sm:px-4 ${
                loading ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="h-8 w-[3px] flex-shrink-0 bg-accent-seal/70" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="truncate font-heading text-fg-1">{r.name}</span>
                    <span className="text-xs text-fg-3">{r.gender === 0 ? '男' : '女'}</span>
                    <span className="text-xs text-fg-3">
                      {r.birthYear}年{r.birthMonth}月{r.birthDay}日
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-fg-muted">
                    {r.createdAt?.slice(0, 10)}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 self-end sm:self-auto">
                <span className="font-heading text-xs text-accent-jade">查看 →</span>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(r.id) }}
                  className="text-sm text-accent-seal/75 transition-colors hover:text-accent-seal"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-center text-xs text-fg-muted">
        共 {filteredRecords.length} 条记录 · 点击记录查看排盘详情
      </div>
    </div>
  )
}

export default Records
