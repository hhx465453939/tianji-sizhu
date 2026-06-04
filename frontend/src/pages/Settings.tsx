import { useNavigate } from 'react-router-dom'

function Settings() {
  const navigate = useNavigate()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">设置</h1>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
          返回
        </button>
      </div>

      <div className="space-y-6">
        {/* About */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">关于天机四柱</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p>版本：v0.1.0</p>
            <p>开源四柱排盘，为 AI 解读而生</p>
            <p className="mt-3">
              排盘算法：
              <a href="https://github.com/mystilight/mystilight-8char" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline ml-1">
                mystilight-8char
              </a>
            </p>
            <p>
              项目仓库：
              <a href="https://github.com/hhx465453939/tianji-sizhu" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline ml-1">
                tianji-sizhu
              </a>
            </p>
          </div>
        </div>

        {/* Prompt Settings */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">AI Prompt 说明</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p>本工具生成结构化 Prompt，您可以复制后粘贴到以下 AI 模型中获取命理解读：</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>DeepSeek（推荐，中文逻辑推理能力强）</li>
              <li>Claude（综合分析能力出色）</li>
              <li>ChatGPT（通用性好）</li>
              <li>其他支持中文的 AI 大模型</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              提示：选择不同的 Prompt 模板可以获得不同维度的深入分析。
            </p>
          </div>
        </div>

        {/* Data Info */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">数据存储</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p>排盘记录保存在本地 SQLite 数据库中，完全离线，不上传任何数据。</p>
            <p>数据位置：~/.tianji-sizhu/charts.db</p>
            <p className="mt-2">支持导出为 JSON 文件，方便备份和迁移。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
