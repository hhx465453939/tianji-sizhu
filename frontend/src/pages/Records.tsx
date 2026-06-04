import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface ChartSummary {
  id: number
  name: string
  gender: number
  createdAt: string
}

function Records() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<ChartSummary[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const { ListCharts } = await import('../../wailsjs/go/main/App')
      const list = await ListCharts()
      setRecords(list || [])
    } catch (e) {
      console.error('load records failed', e)
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
      // Fallback: download via browser
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
        <h1 className="text-2xl font-bold">历史记录</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded text-sm">
            导出 JSON
          </button>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
            返回
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索记录..."
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Records list */}
      {filteredRecords.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          {search ? '没有匹配的记录' : '暂无保存记录'}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredRecords.map(r => (
            <div key={r.id} className="flex justify-between items-center bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
              <div>
                <span className="font-medium">{r.name}</span>
                <span className="ml-2 text-sm text-gray-400">{r.gender === 0 ? '男' : '女'}</span>
                <span className="ml-4 text-xs text-gray-500">{r.createdAt?.slice(0, 10)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(r.id)}
                  className="px-3 py-1 text-red-400 hover:text-red-300 text-sm"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-center text-xs text-gray-500">
        共 {filteredRecords.length} 条记录
      </div>
    </div>
  )
}

export default Records
