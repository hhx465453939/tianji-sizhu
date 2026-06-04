import { useNavigate } from 'react-router-dom'

function Settings() {
  const navigate = useNavigate()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold font-heading text-gold tracking-wide-cn">设置</h1>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-ink-700 hover:bg-ink-600 border border-bronze/30 rounded-sm text-sm transition-colors">
          返回
        </button>
      </div>

      <div className="space-y-6">
        <div className="panel-traditional p-6">
          <h2 className="text-base font-heading text-gold/80 mb-3 tracking-wide-cn border-b border-bronze/20 pb-2">关于天机四柱</h2>
          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <p>版本：v0.1.0</p>
            <p>开源四柱排盘，为 AI 解读而生</p>
            <p className="mt-3">
              排盘算法：
              <a href="https://github.com/mystilight/mystilight-8char" target="_blank" rel="noreferrer" className="text-gold hover:text-gold-light hover:underline ml-1">
                mystilight-8char
              </a>
            </p>
            <p>
              项目仓库：
              <a href="https://github.com/hhx465453939/tianji-sizhu" target="_blank" rel="noreferrer" className="text-gold hover:text-gold-light hover:underline ml-1">
                tianji-sizhu
              </a>
            </p>
          </div>
        </div>

        <div className="panel-traditional p-6">
          <h2 className="text-base font-heading text-gold/80 mb-3 tracking-wide-cn border-b border-bronze/20 pb-2">AI Prompt 说明</h2>
          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <p>本工具生成结构化 Prompt，您可以复制后粘贴到以下 AI 模型中获取命理解读：</p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-[var(--text-tertiary)]">
              <li>DeepSeek（推荐，中文逻辑推理能力强）</li>
              <li>Claude（综合分析能力出色）</li>
              <li>ChatGPT（通用性好）</li>
              <li>其他支持中文的 AI 大模型</li>
            </ul>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              提示：选择不同的 Prompt 模板可以获得不同维度的深入分析。
            </p>
          </div>
        </div>

        <div className="panel-traditional p-6">
          <h2 className="text-base font-heading text-gold/80 mb-3 tracking-wide-cn border-b border-bronze/20 pb-2">数据存储</h2>
          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <p>排盘记录保存在本地 SQLite 数据库中，完全离线，不上传任何数据。</p>
            <p className="text-[var(--text-tertiary)]">数据位置：~/.tianji-sizhu/charts.db</p>
            <p className="mt-2">支持导出为 JSON 文件，方便备份和迁移。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
