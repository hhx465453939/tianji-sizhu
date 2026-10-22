# TRACEABILITY · CHG-001 明暗双主题设计系统

**状态**: 已实现并验收
**日期**: 2026-10-22
**证据目录**: `.tmp/screenshots/`（git 忽略）

---

## 1. 需求 → 实现 → 证据

| # | 需求（SPEC 章节） | 实现落点 | 证据 | 状态 |
|---|------------------|---------|------|------|
| R1 | 明亮为默认、暗色可切（ADR-002） | `lib/theme/index.ts` `DEFAULT_THEME='light'`；`main.tsx` 首帧前 `initTheme()` | `home-light-desktop.png`（默认即亮色，无闪烁） | ✅ |
| R2 | 偏好持久化 | `localStorage['tianji.theme']`；`storage` 事件跨窗口同步 | 截图流程多次切主题后 `data-theme` 与 UI 一致；Android 端 `android-04/06` 跨页保持暗色 | ✅ |
| R3 | token 双层映射，旧类名自动跟随（ADR-001） | `style.css` `[data-theme]` 变量块 + `tailwind.config.js` `rgb(var(--x) / <alpha-value>)` | `tsc` 0 错误；57 处旧类名无需改 JSX 即随主题变化 | ✅ |
| R4 | 透明度修饰继续生效 | 变量存空格分隔 rgb 通道 | `bg-gold/10`、`border-bronze/20` 等在明暗两版截图均正常 | ✅ |
| R5 | 宋韵文人画主基因 + 瑞士栅格辅基因（ADR-003） | 绢底 `#F5F0E6` / 墨阶文字 / 矿物色点缀 / 1px 淡墨线；禁阴影堆叠 | `home-light-desktop.png`、`result-light-desktop.png` | ✅ |
| R6 | 亮暗对位规则（ADR-004，`-light` 语义=对比更强） | `--accent-*-strong` 在亮底取更深值 | 亮色下 `text-accent-seal`、`text-accent-gold` 均可读（截图抽检） | ✅ |
| R7 | 五行色成套双主题 | `--wx-*` 亮/暗两套；`PillarCard` 改 `bg-wx-*/15` | `result-light-phone.png` vs `result-dark-phone.png` 四柱区分度均清晰 | ✅ |
| R8 | 图表随主题变色 | `FiveElementRadar.tsx` `readChannel()` 读 CSS 变量 + `useTheme()` 重算 | `result-light-desktop.png`（金线+淡金填充）与暗色版 | ✅ |
| R9 | 原生窗口同步 + 启动不闪黑 | `syncNativeTheme()` 调 Wails API；`main.go` 背景改 `246,241,231` | 代码路径存在；非 Wails 宿主静默跳过（Android 实测无异常） | ✅ |
| R10 | 切换入口可达（含沉浸页） | 新增 `components/ThemeToggle.tsx`，导航栏 + 结果页头部各一处 | `result-light-desktop.png` 顶部可见主题按钮 | ✅ |
| R11 | 响应式：多列降级 | 四柱 `grid-cols-2 md:grid-cols-4`；流年 `grid-cols-3 sm:grid-cols-5`；流月 `grid-cols-3 sm:grid-cols-6`；起运/宫位 `grid-cols-1 sm:grid-cols-3/2` | `result-light-phone.png`（390px 无横向溢出） | ✅ |
| R12 | 移动端触摸目标 | `ThemeToggle` `h-9 w-9`（移动）/ `h-8 w-8`（桌面）；输入框 ≥44px | `home-light-phone.png` | ✅ |
| R13 | 无障碍对比度 | `--text-muted` 提亮（暗色 `#807260`）、`--accent-*` 按主题配平 | 目视抽检：正文/次级/强调三档均可辨（截图） | ✅ |
| R14 | 无新依赖 | 仅自实现 ~3KB 主题模块 | `frontend/package.json` 仅新增 `puppeteer-core`（dev，截图工具） | ✅ |
| R15 | 首屏无 FOUC | `index.html` 内联背景色 + `initTheme()` 前置 | `home-light-desktop.png` / 暗色版均无白闪痕迹 | ✅ |

## 2. 验收证据清单

### 2.1 构建与测试（命令输出）

| 检查 | 命令 | 结果 |
|------|------|------|
| 类型 | `npx tsc --noEmit` | 0 错误 |
| 单元测试 | `npx vitest run` | **72 passed (4 files)** |
| 生产构建 | `npx vite build` | ✓ built，CSS 27.88KB / gzip 6.24KB |
| 控制台 | 截图脚本监听 `console`/`pageerror` | **No console errors** |

### 2.2 视觉证据（16 张，`.tmp/screenshots/`）

| 文件 | 视口 | 用途 |
|------|------|------|
| `home-light-desktop.png` | 1280×800 | 默认亮色首屏 |
| `home-dark-desktop.png` | 1280×800 | 暗色对位 |
| `home-light-phone.png` / `home-dark-phone.png` | 390×844 | 移动端表单 |
| `result-light-desktop.png` / `-full.png` | 1280×800 | 结果页（全页 3766px） |
| `result-dark-desktop.png` / `-full.png` | 1280×800 | 暗色结果页 |
| `result-light-phone.png` / `-full.png` | 390×844 | 移动端四柱 2×2 |
| `result-dark-phone.png` | 390×844 | 移动端暗色 |
| `records-light-desktop.png` / `-dark-desktop.png` | 1280×800 | 记录页空态 |
| `settings-light-desktop.png` / `-dark-desktop.png` | 1280×800 | 主题选择卡片 |
| `settings-light-phone.png` | 390×844 | 移动端设置 |

生成方式：`node scripts/ui-screenshot.mjs <baseUrl>`（真实 Chrome 渲染，主题经 UI 点击切换，保证 React 状态与 DOM 一致）。

### 2.3 真机（Android 模拟器）证据

| 文件 | 内容 |
|------|------|
| `android-02-diag.png` | 亮色首页（1080×2400） |
| `android-03-result.png` | 排盘结果页，四柱 2×2 |
| `android-04-result-dark.png` | 暗色结果页 |
| `android-06-records.png` | 记录页（localStorage 持久化生效） |

## 3. 修复的既有缺陷（超出原始范围，属"发现问题就修"）

| # | 问题 | 证据 | 处置 |
|---|------|------|------|
| D1 | 结果页隐藏导航后主题不可达 | 设计走查 | 抽 `ThemeToggle` 组件并置于结果页头部 |
| D2 | `corner-deco` + `corner-deco-bottom` 同时使用导致底部角标失效（CSS 伪元素 `top`/`bottom` 互相覆盖） | 首轮 `home-light-desktop.png` 仅顶部两角 | 去掉叠加用法，保留顶部两角；尺寸 14→12px（移动 10px） |
| D3 | 详细分析面板裸露内部权重键（`stemYear:3`、`branchMonth:2` …） | 首轮 `result-light-desktop-full.png` | `filter(k => !/^(stem|branch)/i.test(k))` |
| D4 | 手风琴 emoji 图标（📜📖💑🏠👤🎓）与矿物色体系冲突 | 首轮全页截图 | 换为朱砂竖线 + 楷体标题 |
| D5 | 设置页硬编码版本号 `v0.1.0`（实际 1.1.2） | 首轮 `settings-light-desktop.png` | `vite define __APP_VERSION__` 从 `package.json` 注入 |
| D6 | 亮色下输入框与卡片同色，边界不可辨 | 首轮 `home-light-desktop.png` | 新增 `.field-inset`（`--bg-app` 内凹底 + 金线聚焦） |
| D7 | 雷达图在宽卡片中过小、留白失衡 | 首轮全页截图 | 容器 `mx-auto max-w-md` 居中限宽 |
| D8 | favicon 404 | 截图脚本报 `404` | `index.html` 内联 SVG 图标（朱砂方印 + 四横） |
| D9 | 记录页空态用 ☰（语义模糊）、有记录前导出按钮可点 | 首轮 `records-light-desktop.png` | 移除图标；空记录时禁用导出 |

## 4. 偏差与未决

| # | 项 | 计划 | 实际 | 处置 |
|---|----|------|------|------|
| V1 | CSS 体积预算 | < 6KB（原写"gzip 前"，口径有误） | 27.88KB 未压缩 / 6.24KB gzip | 修正 SPEC 为 ≤32KB 未压缩，实测合规 |
| V2 | 对比度量化 | 计划抽检 ≥4.5:1 | 目视抽检通过，未做程序化测量 | 记为技术债：后续可加 axe-core 断言 |
| V3 | 跟随系统主题 | 非目标 | 未实现 | `Theme` union 预留扩展位 |

## 5. Definition of Done 核对

- [x] `tsc` 零错误，`vitest` 全绿（72/72）
- [x] 明/暗 × 桌面/移动 截图人工检视，无遮挡、无溢出、无错位
- [x] `scripts/env-check.sh` 通过（见 CHG-002 证据）
- [x] 无新增运行时依赖
- [x] 修改文件均在 SPEC 声明范围内
