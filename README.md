# 天机四柱 (TianJi-SiZhu)

> 开源四柱排盘，为 AI 解读而生

一款开源的八字（四柱）排盘桌面客户端，集成美观可视化界面、完整神煞大运系统、本地数据持久化，以及面向 AI 大模型的结构化 Prompt 生成能力。

## 功能特性

- **完整排盘**: 四柱、十神、五行、大运、流年、神煞
- **数据可视化**: 五行雷达图、大运时间轴、关系连线图
- **明暗双主题**: 明亮（宣纸晨光，默认）/ 暗色（玄墨夜观），偏好本地记忆
- **本地存储**: 桌面 SQLite / 安卓 localStorage，离线可用
- **AI Prompt 生成**: 一键生成结构化命理分析提示词
- **多端支持**: Windows / macOS / Linux 桌面客户端 + Android APK

## 技术栈

- **桌面框架**: Wails v2 (Go + WebView2)
- **安卓框架**: Capacitor 8 (WebView 壳)
- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **排盘算法**: mystilight-8char
- **可视化**: ECharts
- **存储**: SQLite (modernc.org/sqlite) / localStorage

## 下载

前往 [Releases](https://github.com/hhx465453939/tianji-sizhu/releases) 页面下载对应平台的安装包：

| 平台 | 架构 | 安装包 | 免安装 |
|------|------|--------|--------|
| Windows | x64 | `tianji-sizhu-<ver>-windows-amd64-setup.exe` | `tianji-sizhu-<ver>-windows-amd64-portable.zip` |
| Windows | arm64 | `tianji-sizhu-<ver>-windows-arm64-setup.exe` | `tianji-sizhu-<ver>-windows-arm64-portable.zip` |
| macOS | Intel (x64) | `tianji-sizhu-<ver>-macos-amd64-installer.pkg` | `tianji-sizhu-<ver>-macos-amd64-app.zip` |
| macOS | Apple Silicon (arm64) | `tianji-sizhu-<ver>-macos-arm64-installer.pkg` | `tianji-sizhu-<ver>-macos-arm64-app.zip` |
| Android | arm64-v8a | `tianji-sizhu-<ver>-android-arm64-v8a.apk`（主流手机） | — |
| Android | armeabi-v7a | `tianji-sizhu-<ver>-android-armeabi-v7a.apk`（旧设备） | — |
| Android | x86_64 | `tianji-sizhu-<ver>-android-x86_64.apk`（模拟器） | — |
| Android | x86 | `tianji-sizhu-<ver>-android-x86.apk`（32 位 x86 模拟器） | — |
| Android | universal | `tianji-sizhu-<ver>-android-universal.apk`（不确定机型选它） | — |

每个产物都可用 `SHA256SUMS-<ver>.txt` 校验，架构与版本断言记录在 `artifacts-manifest.json`。

> **Windows**：安装包未做代码签名，SmartScreen 可能拦截 →「更多信息」→「仍要运行」。
> **macOS**：ad-hoc 签名，首次打开请右键 →「打开」；或 `xattr -dr com.apple.quarantine /Applications/tianji-sizhu.app`。请勿全局关闭 Gatekeeper。
> **Android**：调试签名，侧载需允许「未知来源」。

## 开发

```bash
# 安装依赖
cd frontend && pnpm install && cd ..

# 开发模式
wails dev

# 生产构建 (Windows x64)
wails build -platform windows/amd64

# 本地打包 (含 NSIS 安装程序)
build.cmd --installer                  # Windows (推荐，免执行策略)
.\scripts\build.ps1 -Installer         # Windows PowerShell
./scripts/build.sh                     # macOS / Linux

# 安卓 APK（全 ABI + universal，SDK 自动引导到项目内 .android/）
./scripts/android-build.sh
./scripts/android-build.sh arm64-v8a   # 只取单个 ABI

# 环境隔离自检（确认工具链未外溢到主机全局）
./scripts/env-check.sh
```

### 发布 Release

```powershell
# 创建 v1.0.0 标签并触发 GitHub Actions 自动构建发布
.\scripts\create-release.ps1                   # Windows
./scripts/create-release.sh                    # macOS / Linux

# 指定版本号
.\scripts\create-release.ps1 -Version 1.1.0
```

## 环境要求

- Go 1.23+
- Node.js 22+
- pnpm（CI 可用 npm）
- Wails CLI v2（桌面构建）
- Java 21（安卓构建）
- (可选) NSIS — 用于构建 Windows 安装程序

> **安卓构建环境完全虚拟化**：SDK / Gradle 缓存 / AVD / 签名密钥全部落在项目内的 `.android/`，
> 不写入任何主机全局路径。详见 `AGENTS.md` → 虚拟化与隔离部署治理。
> 删除 `.android/` 即可完全卸载。

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
