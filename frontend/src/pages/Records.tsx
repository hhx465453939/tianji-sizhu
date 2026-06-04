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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">历史记录</h1>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-700 rounded text-sm">
          返回
        </button>
      </div>

      {records.length === 0 ? (
        <p className="text-gray-500 text-center py-12">暂无保存记录</p>
      ) : (
        <div className="space-y-2">
          {records.map(r => (
            <div key={r.id} className="flex justify-between items-center bg-gray-800 rounded-lg p-4">
              <div>
                <span className="font-medium">{r.name}</span>
                <span className="ml-2 text-sm text-gray-400">{r.gender === 0 ? '男' : '女'}</span>
                <span className="ml-4 text-xs text-gray-500">{r.createdAt.slice(0, 10)}</span>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                className="px-3 py-1 text-red-400 hover:text-red-300 text-sm"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Records
