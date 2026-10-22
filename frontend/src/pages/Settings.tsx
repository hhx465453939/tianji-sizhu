import { useNavigate } from 'react-router-dom'
import { useTheme, type Theme } from '../lib/theme'

const THEME_OPTIONS: Array<{
  value: Theme
  label: string
  hint: string
  swatch: { bg: string; panel: string; text: string; seal: string }
}> = [
  {
    value: 'light',
    label: '宣纸晨光',
    hint: '默认 · 明亮室内 / 白天',
    swatch: { bg: '#F6F1E7', panel: '#FBF7EF', text: '#241E17', seal: '#B23A28' },
  },
  {
    value: 'dark',
    label: '玄墨夜观',
    hint: '低光环境 / 夜间',
    swatch: { bg: '#14100C', panel: '#1E1813', text: '#E9DFCC', seal: '#D4523A' },
  },
]

function Settings() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8 md:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-heading text-lg tracking-wide-cn text-fg-1 md:text-xl">设置</h1>
        <button
          onClick={() => navigate('/')}
          className="rounded-sm border border-line-1 bg-surface-3 px-3 py-2 text-sm text-fg-2 transition-colors hover:border-accent-gold/40 hover:text-fg-1 md:px-4"
        >
          返回
        </button>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Appearance */}
        <div className="panel-traditional p-4 md:p-6">
          <h2 className="mb-3 border-b border-line-1 pb-2 font-heading text-sm tracking-wide-cn text-fg-1 md:text-base">
            外观主题
          </h2>
          <p className="mb-4 text-xs leading-relaxed text-fg-3">
            明亮主题为默认画面，暗色主题适合低光环境。选择后会立即生效并记住偏好。
          </p>

          <div className="grid grid-cols-2 gap-3 md:max-w-md">
            {THEME_OPTIONS.map(opt => {
              const active = theme === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  aria-pressed={active}
                  className={`group rounded-sm border p-2 text-left transition-colors ${
                    active
                      ? 'border-accent-seal bg-accent-seal/5'
                      : 'border-line-1 hover:border-accent-gold/50'
                  }`}
                >
                  <div
                    className="mb-2 flex h-14 items-center justify-center gap-1.5 rounded-sm border"
                    style={{ backgroundColor: opt.swatch.bg, borderColor: `${opt.swatch.text}22` }}
                  >
                    <span
                      className="flex h-8 w-6 items-center justify-center rounded-[1px] text-[10px]"
                      style={{ backgroundColor: opt.swatch.panel, color: opt.swatch.text }}
                    >
                      甲子
                    </span>
                    <span className="h-8 w-[3px]" style={{ backgroundColor: opt.swatch.seal }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-heading ${active ? 'text-accent-seal' : 'text-fg-1'}`}>
                      {opt.label}
                    </span>
                    {active && <span className="text-[10px] text-accent-seal">✓</span>}
                  </div>
                  <div className="mt-0.5 text-[10px] leading-snug text-fg-muted">{opt.hint}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="panel-traditional p-4 md:p-6">
          <h2 className="mb-3 border-b border-line-1 pb-2 font-heading text-sm tracking-wide-cn text-fg-1 md:text-base">
            关于天机四柱
          </h2>
          <div className="space-y-2 text-sm text-fg-2">
            <p>版本：v{__APP_VERSION__}</p>
            <p>开源四柱排盘，为 AI 解读而生</p>
            <p className="mt-3 break-words">
              排盘算法：
              <a href="https://github.com/mystilight/mystilight-8char" target="_blank" rel="noreferrer" className="ml-1 text-accent-gold hover:underline">
                mystilight-8char
              </a>
            </p>
            <p className="break-words">
              项目仓库：
              <a href="https://github.com/hhx465453939/tianji-sizhu" target="_blank" rel="noreferrer" className="ml-1 text-accent-gold hover:underline">
                tianji-sizhu
              </a>
            </p>
          </div>
        </div>

        <div className="panel-traditional p-4 md:p-6">
          <h2 className="mb-3 border-b border-line-1 pb-2 font-heading text-sm tracking-wide-cn text-fg-1 md:text-base">
            AI Prompt 说明
          </h2>
          <div className="space-y-2 text-sm text-fg-2">
            <p>本工具生成结构化 Prompt，您可以复制后粘贴到以下 AI 模型中获取命理解读：</p>
            <ul className="ml-2 list-inside list-disc space-y-1 text-fg-3">
              <li>DeepSeek（推荐，中文逻辑推理能力强）</li>
              <li>Claude（综合分析能力出色）</li>
              <li>ChatGPT（通用性好）</li>
              <li>其他支持中文的 AI 大模型</li>
            </ul>
            <p className="mt-3 text-xs text-fg-muted">
              提示：选择不同的 Prompt 模板可以获得不同维度的深入分析。
            </p>
          </div>
        </div>

        <div className="panel-traditional p-4 md:p-6">
          <h2 className="mb-3 border-b border-line-1 pb-2 font-heading text-sm tracking-wide-cn text-fg-1 md:text-base">
            数据存储
          </h2>
          <div className="space-y-2 text-sm text-fg-2">
            <p>排盘记录保存在本地，完全离线，不上传任何数据。</p>
            <p className="text-fg-3">桌面端：安装目录/data/charts.db · 安卓端：应用本地存储</p>
            <p className="mt-2">支持导出为 JSON 文件，方便备份和迁移。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
