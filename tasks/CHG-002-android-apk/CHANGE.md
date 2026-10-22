# CHG-002 · Android APK 打包与多架构发布

**变更编号**: CHG-002
**提出日期**: 2026-10-22
**类型**: 新平台能力 + 构建体系 + CI/CD
**影响面**: `frontend/`（平台适配层、路由）、新增 `android/`、`scripts/`、`.github/workflows/release.yml`、`.cnb.yml`

---

## 1. 动机

桌面形态限制了使用场景：命理查询是典型的"随时随地"需求，用户在手机上完成一次排盘、复制 Prompt 到 AI 对话，是最短路径。当前项目只有 Windows/macOS/Linux 桌面包，缺失最大的用户入口。

## 2. 硬约束（决定方案的事实）

1. **Wails v2 不支持 Android**。官方支持矩阵仅 windows / darwin / linux；移动端不在 v2 范围内。
2. **Go 后端无法在 Android 进程内运行**。因此 SQLite CRUD、系统剪贴板、原生文件对话框这些绑定在安卓上不可用。
3. 好消息：**核心能力全在前端**。排盘算法（mystilight-8char）、Prompt 生成、ECharts 可视化均为纯 JS，可在 WebView 中原样运行。
4. 用户要求：**所有主流 Android 架构的 APK**，并在 CI/CD 与 Release 中发布。
5. 治理红线：Android SDK / Gradle 缓存 / AVD **必须落在项目目录内**（见 AGENTS.md）。

## 3. 目标

- 产出可安装的 Android APK，功能对齐桌面端"排盘 → 查看 → 复制 Prompt"主链路
- 同时产出 `arm64-v8a`、`armeabi-v7a`、`x86_64`、`universal` 四个安装包
- 数据保存在设备本地（无网络依赖），并支持导出
- CI 在 tag push 时自动构建并挂到 Release；同时更新 CNB 流水线
- 本地构建环境完全虚拟化在项目内，`rm -rf .android` 即无残留
- 移动端 UI 通过真实视口截图验收

## 4. 非目标

- 不把 Go 后端移植到 Android（不上 gomobile，不做 NDK 交叉编译）
- 不做 iOS（留待后续，Capacitor 工程已为其预留路径）
- 不做后台服务/推送/账号体系
- 不追求 Play Store 上架合规（仅提供可侧载 APK）

## 5. 交付

见 `SPEC.md`（工程契约）与 `TRACEABILITY.md`（需求→实现→证据映射）。
