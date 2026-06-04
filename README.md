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

## 致谢

本项目的诞生离不开以下优秀开源项目的启发与支持：

| 项目 | 贡献 |
|------|------|
| [mystilight-8char](https://github.com/mystilight/mystilight-8char) | 核心排盘算法引擎，提供完整的四柱、十神、神煞、大运计算能力 |
| [8Char-H5](https://github.com/mrsunx/8Char-H5) | 基于 UniAPP 的八字排盘工具，功能设计上给予了重要参考 |
| [cantian-ai/bazi-mcp](https://github.com/cantian-ai/bazi-mcp) | JSON 结构化输出与 RESTful API 设计思路的参考 |
| [命语 (mingyu)](https://github.com/nicekid1/mingyu) | "排盘 + AI Prompt"深度结合的前瞻性理念启发 |
| [Wails](https://github.com/wailsapp/wails) | 轻量级 Go + WebView 桌面应用框架 |
| [ECharts](https://github.com/apache/echarts) | 强大的数据可视化图表库 |

同时感谢开源命理社区中众多无私分享算法与经验的开发者们。

## 协议

见 [LICENSE](./LICENSE) 文件。
