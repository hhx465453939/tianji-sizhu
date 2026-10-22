import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const HOURS = [
  '子时 (23:00-01:00)', '丑时 (01:00-03:00)', '寅时 (03:00-05:00)',
  '卯时 (05:00-07:00)', '辰时 (07:00-09:00)', '巳时 (09:00-11:00)',
  '午时 (11:00-13:00)', '未时 (13:00-15:00)', '申时 (15:00-17:00)',
  '酉时 (17:00-19:00)', '戌时 (19:00-21:00)', '亥时 (21:00-23:00)',
]

const fieldClass =
  'field-inset w-full min-w-0 px-3 py-2.5 '

const labelClass =
  'block text-xs text-fg-3 mb-1.5 tracking-wide-cn'

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
    <div className="min-h-[calc(100vh-3.5rem)] px-5 py-10 md:py-16">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">

        {/* Title block: brand + seal accent, generous air above the form */}
        <div className="mb-8 flex flex-col items-center text-center md:mb-10">
          <h1 className="font-heading text-2xl leading-tight tracking-traditional text-fg-1 md:text-3xl">
            天机四柱
          </h1>
          <div className="divider-traditional my-4 w-40 md:w-48" />
          <p className="text-xs tracking-wide-cn text-fg-3 md:text-sm">
            开源四柱排盘 · 为 AI 解读而生
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="corner-deco panel-traditional w-full space-y-5 p-5 md:p-8"
        >
          <div>
            <label className={labelClass}>姓名/备注</label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="可选"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className={labelClass}>性别</label>
              <select
                value={form.gender}
                onChange={e => update('gender', parseInt(e.target.value))}
                className={fieldClass}
              >
                <option value={0}>男</option>
                <option value={1}>女</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>历法</label>
              <select
                value={form.calendar}
                onChange={e => update('calendar', parseInt(e.target.value))}
                className={fieldClass}
              >
                <option value={0}>阳历</option>
                <option value={1}>阴历</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className={labelClass}>年</label>
              <input
                type="number"
                inputMode="numeric"
                min={1900}
                max={2100}
                value={form.year}
                onChange={e => update('year', parseInt(e.target.value))}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>月</label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={12}
                value={form.month}
                onChange={e => update('month', parseInt(e.target.value))}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>日</label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                value={form.day}
                onChange={e => update('day', parseInt(e.target.value))}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>时辰</label>
            <select
              value={form.hour}
              onChange={e => update('hour', parseInt(e.target.value))}
              className={fieldClass}
            >
              {HOURS.map((h, i) => (
                <option key={i} value={i}>{h}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary-cn w-full rounded-sm py-3 font-heading text-base tracking-traditional"
          >
            排 盘
          </button>

          <button
            type="button"
            onClick={() => navigate('/records')}
            className="w-full rounded-sm border border-line-1 bg-surface-3 py-2.5 text-sm text-fg-2 transition-colors hover:border-accent-gold/40 hover:text-fg-1"
          >
            查看历史记录
          </button>
        </form>

        <p className="mt-6 text-[11px] tracking-wide-cn text-fg-muted">
          本地计算 · 离线可用 · 不上传任何数据
        </p>
      </div>
    </div>
  )
}

export default Home
