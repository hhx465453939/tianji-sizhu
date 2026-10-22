---
change_id: CHG-002
version: 1
status: approved
prd_ref: CHANGE.md
health_ref: docs/SPEC.md
supersedes: null
approved_by: user (delegated, "一气呵成，不用特意停下来问我")
approved_at: 2026-10-22
---

# SPEC · Android APK 打包与多架构发布

## 1. Context

### 1.1 现状

```
main.go            wails.Run(...)                     仅桌面
app.go             SaveChart/GetChart/ListCharts/...  Go → SQLite
frontend/pages/*   直接 import('../../wailsjs/go/main/App')   强耦合 Wails
App.tsx            BrowserRouter（依赖 history 路径）
frontend/package.json  纯 web 构建（vite build → dist/）
CI                 .github/workflows/release.yml 三平台；.cnb.yml 国内流水线
```

### 1.2 阻塞点

| # | 阻塞 | 影响 | 处置方向 |
|---|------|------|---------|
| B1 | Wails 绑定在 Android 不存在 | 4 个页面共 8 处调用会 await 抛错 | 平台适配层 + 条件实现 |
| B2 | `BrowserRouter` 在 WebView 深链/刷新下 404 | 路由失效 | 改 `HashRouter`（桌面端同样可用） |
| B3 | `SaveFileDialog` / `WriteFile` 仅桌面 | 导出功能在安卓失效 | Web 侧 Blob + Share |
| B4 | SQLite 依赖 Go | 记录无法保存 | localStorage 适配器（同 schema 语义） |
| B5 | 无 Android SDK / Gradle | 无法构建 | 项目内虚拟 SDK + Gradle 引导脚本 |
| B6 | 多列布局在 390px 挤压 | 移动端不可用 | 由 CHG-001 的响应式里程碑覆盖 |

### 1.3 约束

- 单机资源：8GB 内存 / 2 核 4 线程 → Gradle 必须 `--no-daemon --max-workers=2`
- 磁盘：SDK + Gradle 约 1.5–2.5GB，需落在项目内
- 时间：不引入需要 NDK 编译的原生插件（避免 30min+ 构建）

## 2. 设计决策（ADR）

### ADR-001 跨平台打包方案

| 方案 | 机制 | 结论 |
|------|------|------|
| **A. Capacitor 8 壳 + 现有 web 构建** | WebView 加载 `dist/`，原生层仅做壳/权限/生命周期 | **选中** |
| B. Wails v3（含移动端 alpha） | 官方移动支持 | 否决：v3 尚在 alpha，Go↔JS 桥在移动端不稳，风险不可控 |
| C. gomobile + Go 绑定 | 把 Go 编译为 .aar | 否决：需 NDK + CGO，构建 30min+，且 SQLite 驱动（modernc）在 android/arm 未验证 |
| D. Cordova | 同类壳 | 否决：生态老化，Capacitor 是其现代替代 |
| E. 重写原生 Android（Kotlin + Compose） | 原生体验最佳 | 否决：双实现维护成本，与"增量迭代"目标冲突 |

**A 的收益**：一套前端代码，两端运行；算法零改动；Capacitor 8 与 Node 24 / Java 21 匹配；后续 iOS 仅需加 `@capacitor/ios`。

**代价**：Android 端无 SQLite（改 localStorage）、无原生文件对话框（改 Blob 下载/分享）。

### ADR-002 数据层策略

```
                  ┌─────────────────────────────┐
  UI (pages)  ──▶ │  lib/platform/index.ts       │  统一接口
                  │  ChartStore / Clipboard / IO │
                  └───────┬─────────────┬────────┘
                          │             │
                  wails.ts│             │web.ts
                          ▼             ▼
                 window.go.main     localStorage
                 (SQLite via Go)    (JSON array)
```

- **接口统一**：`listCharts/getChart/saveChart/deleteChart/exportJSON/copyText/saveFile`
- **运行时探测**：`typeof window.go?.main?.SaveChart === 'function'`，不用编译期分支（同一份 dist 两个宿主共用）
- **Web 存储 schema**：与 SQLite `charts` 表字段名保持一致（`id/name/gender/birthYear/.../createdAt`），导出 JSON 结构不变，实现双向迁移
- **ID 生成**：`Date.now()` 单调递增，配合 `crypto.randomUUID()` 兜底，避免并发冲突
- **容量**：localStorage ~5MB，单条记录约 4–8KB → 支撑 500+ 条；超出时提示导出

### ADR-003 路由与资源加载

- `BrowserRouter` → `HashRouter`（`#/result`）。桌面 Wails 的 AssetServer 同样支持 hash 路由，行为一致
- Capacitor `server.androidScheme = 'https'`，`appId = com.tianjisizhu.app`
- `webDir = ../frontend/dist`，由 `pnpm build` 产出，不重复构建
- 禁用 Capacitor 远程更新（`autoUpdate: false`），保持离线

### ADR-004 多 ABI 策略

Capacitor 壳本身无 `.so`，理论上 universal APK 已覆盖全部设备。但用户要求"所有主流架构安装包"，且未来若接入原生插件即需要分 ABI：

```gradle
splits {
  abi {
    enable true
    reset()
    include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
    universalApk true
  }
}
```

- 产出：`app-armeabi-v7a-release.apk`、`app-arm64-v8a-release.apk`、`app-x86-release.apk`、`app-x86_64-release.apk`、`app-universal-release.apk`
- 命名在 CI 中重写为 `tianji-sizhu-<version>-android-<abi>.apk`
- `minSdk 23`（Android 6.0，覆盖 99%+ 设备），`targetSdk 35`
- 签名：CI 无密钥时用 debug 签名并明确标注 `-debug-signed`；有 `ANDROID_KEYSTORE_BASE64` secret 时走 release 签名

### ADR-005 环境虚拟化

| 项 | 路径 | 变量 |
|----|------|------|
| SDK | `.android/sdk` | `ANDROID_HOME` / `ANDROID_SDK_ROOT` |
| Gradle | `.android/gradle-home` | `GRADLE_USER_HOME` |
| AVD | `.android/avd` | `ANDROID_AVD_HOME` |
| 用户配置 | `.android/home` | `ANDROID_USER_HOME` |
| 临时 | `.tmp` | `TMPDIR` |

`scripts/android-env.sh` 负责导出；`scripts/android-sdk.sh` 负责按需下载 cmdline-tools + platform + build-tools（幂等）。

## 3. 接口契约

```ts
// frontend/src/lib/platform/types.ts
export interface ChartRecord {
  id: number
  name: string
  gender: number
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number
  calendar: number
  chartData: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface ChartSummary {
  id: number
  name: string
  gender: number
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number
  calendar: number
  createdAt: string
}

export interface PlatformAdapter {
  readonly kind: 'desktop' | 'web'
  saveChart(input: SaveChartInput): Promise<number>
  getChart(id: number): Promise<ChartRecord>
  listCharts(): Promise<ChartSummary[]>
  deleteChart(id: number): Promise<void>
  exportJSON(): Promise<string>
  copyText(text: string): Promise<boolean>
  saveFile(filename: string, content: string): Promise<boolean>
}
```

- 所有方法**不得抛出未捕获错误**，内部降级并返回可判定值
- `saveFile` 桌面走原生对话框，Web 走 `Blob` + `<a download>`，失败返回 `false`
- `copyText` 依次尝试 `navigator.clipboard` → Wails → `execCommand`

## 4. 里程碑

| # | 里程碑 | 依赖 | 文件 | 验收 | 风险 | 回滚 |
|---|--------|------|------|------|------|------|
| M1 | 平台适配层 | CHG-001 M4 | `lib/platform/*`、4 页面改造 | 桌面功能回归无变化；Web 模式记录可增删查 | localStorage 配额/序列化 | 页面回退直接调用 wailsjs |
| M2 | 路由与移动布局 | M1、CHG-001 M6 | `App.tsx`、`components/*` | 桌面/移动均能深链与刷新 | hash 路由导致桌面行为差异 | 恢复 BrowserRouter |
| M3 | 虚拟化构建环境 | - | `scripts/android-env.sh`、`scripts/android-sdk.sh`、`.gitignore` | `env-check.sh` 全 PASS；主机无新增全局目录 | 下载中断/版本不匹配 | 删除 `.android` 重来 |
| M4 | Capacitor 工程 | M1、M3 | `frontend/capacitor.config.ts`、`android/**` | `assembleRelease` 产出 5 个 APK | Gradle/AGP 版本冲突 | 删除 `android/` 重新 add |
| M5 | CI 与 Release | M4 | `.github/workflows/release.yml`、`.cnb.yml` | tag 触发后 APK 出现在 Release 资产 | Ubuntu runner SDK 版本 | 回滚 workflow |
| M6 | 验证与证据 | M4 | `TRACEABILITY.md` | aapt 校验 ABI/包名/版本；移动视口截图；安装冒烟或降级说明 | 模拟器内存不足 | 降级为静态校验并记录 |

## 5. Definition of Ready / Done

**DoR**
- CHG-001 响应式里程碑完成（避免移动端二次返工）
- Android 构建环境可复现（`scripts/android-sdk.sh` 幂等）

**DoD**
- `assembleRelease` 成功，5 个 APK 文件存在且非 0 字节
- `aapt2 dump badging` 校验：包名 `com.tianjisizhu.app`、`minSdk 23`、`targetSdk 35`、版本号与 `package.json` 一致
- 每个 APK 的 `lib/` 目录 ABI 与命名匹配（universal 含全部）
- 桌面构建与测试不回归（`pnpm test`、`wails build`）
- 移动视口（390×844、360×800）明/暗截图无溢出
- `.gitignore` 覆盖 `.android/`、`.tmp/`、`*.apk`；`git status` 无虚拟环境文件

## 6. Review Gate

- 安全 Gate：无硬编码密钥；签名密钥仅走 CI secret；APK 不请求多余权限
- 体积 Gate：单 ABI APK ≤ 12MB，universal ≤ 16MB
- 兼容 Gate：`minSdk 23` 声明与实际 API 使用一致（无 `@RequiresApi` 缺失）
- 隔离 Gate：`scripts/env-check.sh` PASS

## 7. 未决问题

| # | 问题 | 处置 |
|---|------|------|
| Q1 | 是否接入 Play Store 分发？ | 不做，仅 Release 侧载 |
| Q2 | 安卓端是否保留 SQLite（通过 sql.js/wasm）？ | 暂不：localStorage 足够 500+ 条，且零额外体积；量级增长后再评估 |
| Q3 | iOS 何时支持？ | 待 CHG-003，复用本 CHG 的适配层与 Capacitor 工程 |
| Q4 | 模拟器冒烟是否强制？ | 本机 8GB，若 emulator 无法在可用内存内启动，降级为「静态 APK 校验 + WebView 视口渲染截图 + 单元测试」并在 TRACEABILITY 记录原因 |
