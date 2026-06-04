import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const HOURS = [
  '子时 (23:00-01:00)', '丑时 (01:00-03:00)', '寅时 (03:00-05:00)',
  '卯时 (05:00-07:00)', '辰时 (07:00-09:00)', '巳时 (09:00-11:00)',
  '午时 (11:00-13:00)', '未时 (13:00-15:00)', '申时 (15:00-17:00)',
  '酉时 (17:00-19:00)', '戌时 (19:00-21:00)', '亥时 (21:00-23:00)',
]

function Home() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    gender: 0,
    year: 1990,
    month: 1,
    day: 1,
    hour: 0,
    calendar: 0,
  })

  const update = (field: string, value: number | string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/result', { state: form })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-2">天机四柱</h1>
      <p className="text-gray-400 mb-8">开源四柱排盘，为 AI 解读而生</p>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">姓名/备注</label>
          <input
            type="text"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            placeholder="可选"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">性别</label>
            <select
              value={form.gender}
              onChange={e => update('gender', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded"
            >
              <option value={0}>男</option>
              <option value={1}>女</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">历法</label>
            <select
              value={form.calendar}
              onChange={e => update('calendar', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded"
            >
              <option value={0}>阳历</option>
              <option value={1}>阴历</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">年</label>
            <input
              type="number"
              min={1900}
              max={2100}
              value={form.year}
              onChange={e => update('year', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">月</label>
            <input
              type="number"
              min={1}
              max={12}
              value={form.month}
              onChange={e => update('month', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">日</label>
            <input
              type="number"
              min={1}
              max={31}
              value={form.day}
              onChange={e => update('day', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">时辰</label>
          <select
            value={form.hour}
            onChange={e => update('hour', parseInt(e.target.value))}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded"
          >
            {HOURS.map((h, i) => (
              <option key={i} value={i}>{h}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition-colors"
        >
          排盘
        </button>

        <button
          type="button"
          onClick={() => navigate('/records')}
          className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 text-sm transition-colors"
        >
          查看历史记录
        </button>
      </form>
    </div>
  )
}

export default Home
