# 天机四柱 (TianJi-SiZhu)

> 开源四柱排盘，为 AI 解读而生

一款开源的八字（四柱）排盘桌面客户端，集成美观可视化界面、完整神煞大运系统、本地数据持久化，以及面向 AI 大模型的结构化 Prompt 生成能力。

## 功能特性

- **完整排盘**: 四柱、十神、五行、大运、流年、神煞
- **数据可视化**: 五行雷达图、大运时间轴、关系连线图
- **本地存储**: SQLite 嵌入式数据库，离线可用
- **AI Prompt 生成**: 一键生成结构化命理分析提示词
- **轻量原生**: 基于 Wails，安装包 < 20MB

## 技术栈

- **桌面框架**: Wails v2 (Go + WebView2)
- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **排盘算法**: mystilight-8char
- **可视化**: ECharts
- **存储**: SQLite (modernc.org/sqlite)

## 开发

```bash
# 安装依赖
cd frontend && pnpm install && cd ..

# 开发模式
wails dev

# 生产构建 (Windows x64)
wails build -platform windows/amd64
```

## 环境要求

- Go 1.23+
- Node.js 18+
- pnpm
- Wails CLI v2

## 协议

见 [LICENSE](./LICENSE) 文件。
