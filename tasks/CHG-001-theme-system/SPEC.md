---
change_id: CHG-001
version: 1
status: approved
prd_ref: CHANGE.md
health_ref: docs/SPEC.md
supersedes: null
approved_by: user (delegated, "一气呵成，不用特意停下来问我")
approved_at: 2026-10-22
---

# SPEC · 明暗双主题设计系统

## 1. Context

### 1.1 现状架构

```
frontend/src/style.css
  :root { --bg-primary:#1a1410; --text-primary:#e8dcc8; --accent-* ... }
  body   { background: var(--bg-primary); color: var(--text-primary) }

frontend/tailwind.config.js
  colors: { ink:{900..500 静态hex}, parchment:{50..700 静态hex},
            cinnabar/gold/jade/bronze/五行色 静态hex }

页面与组件
  混用两套写法：
    (a) CSS 变量  text-[var(--text-secondary)]        ~40 处
    (b) Tailwind   bg-ink-800 / text-parchment-100    ~57 处
  六边形硬编码   #7c5cbf #6b9bc3 #c9a84c #b69cf0 #d4a017   ~15 处
```

### 1.2 债务判定

- **单主题锁死**：`body` 直接消费固定变量，无切换入口，暗色是"唯一真相"
- **颜色双轨制**：变量与 Tailwind 静态 hex 并存，改一处不生效，是未来最大的视觉债务
- **无语义层**：`ink-800` 既当"导航底色"又当"输入框底色"，语义缺失导致亮色化时无法整体推演
- **对比度未治理**：暗色下 `text-muted #6b5d4d` 对 `#1a1410` 仅约 3.2:1，已达正文下限之下
- **响应式缺口**：`grid-cols-4`（四柱）、`grid-cols-5`（流年）、`grid-cols-6`（流月）在 390px 宽度挤压至不可读

### 1.3 约束

- 不新增运行时依赖（主题能力 < 3KB 自实现）
- 必须保留所有既有 Tailwind 类名可用，避免 300+ 处无差别改写引入回归
- Windows WebView2 / Android WebView 均需支持（`color-mix` 不使用，仅用 rgb 通道 + opacity）
- 低配机约束：无重型 CSS 滤镜/模糊，动画仅 `transition-colors/transform`

## 2. 设计决策（ADR）

### ADR-001 主题切换机制

| 方案 | 说明 | 结论 |
|------|------|------|
| **A. `<html data-theme>` + CSS 变量双层映射** | Tailwind 颜色改为 `rgb(var(--x) / <alpha-value>)`；旧类名语义不变，仅值随主题变 | **选中** |
| B. 组件级 `dark:` 前缀重写 | 每处颜色写两份（`bg-white dark:bg-ink-800`） | 否决：57 处类名 × 2，易漏、难回滚 |
| C. CSS-in-JS ThemeProvider | 运行时注入样式 | 否决：新依赖 + 与 Tailwind 构建链冲突 + 首屏闪烁 |

**A 的关键收益**：旧类名 `bg-ink-800` 在亮色主题下自动变成"纸面次级底"，无需改 JSX。组件层只需新增语义 token 用于新代码。

**透明度兼容**：`bg-gold/10` 等 43 处透明度修饰必须继续工作，因此变量存 **空格分隔 rgb 通道**（`--accent-gold: 176 138 48`），Tailwind 侧写 `rgb(var(--accent-gold) / <alpha-value>)`。

**可逆性**：删除 `[data-theme="dark"]` 块即回到单主题；删除 `<html data-theme>` 属性即回退；变量值与旧 hex 一一可查。

### ADR-002 主题默认值与持久化

- 默认 `light`（不跟随系统），理由：产品定位"宣纸晨光"，且系统深色用户仍可一键切换，避免首屏与预期不符
- 持久化键 `tianji.theme`，值 `light|dark`
- 初始化在 `main.tsx` **首次渲染前同步执行**（内联 `beforeRender()`），避免 FOUC
- 桌面端额外调用 Wails `WindowSetLightTheme()/WindowSetDarkTheme()` 同步标题栏；非 Wails 环境静默跳过

### ADR-003 美术基因（taste 决策）

- **情绪定位**：清朗（lucid）—— 读者应感到"晨光下摊开的一册宣纸命书"，可读、可信、有底蕴，而非神秘晦暗
- **主基因**：宋韵文人画（`code-genes/03 中国画留白`）—— 绢底暖白、墨阶文字、矿物色点缀、1px 淡墨线分区、禁阴影堆叠
- **辅基因**：瑞士平面网格（`code-genes/01`）—— 仅取"字号层级 + 功能化留白 + 无装饰边框"，用于承载高密度术数数据，防止国风退化为装饰堆砌
- **混搭纪律**：只混一层——辅基因只作用于**栅格与字号**，不引入西式卡片圆角/彩色块
- **自检**：主=宋韵绢素，辅=瑞士栅格；若某屏出现"圆角白卡 + 蓝紫渐变"即判定基因污染

### ADR-004 亮/暗对位的语义规则

亮色主题不是"把暗色反相"，而是**同一套语义在两套光环境下的重新配平**：

| 语义 | 亮色取值策略 | 暗色取值策略 |
|------|-------------|-------------|
| 背景层级 | 由浅到深（绢 → 纸 → 榻） | 由深到浅（玄 → 炭 → 陶） |
| 文字 | 墨色阶，主字接近纯墨 | 纸色阶，主字接近宣纸 |
| 强调色 | **加深**（保证亮底对比度） | **提亮**（保证暗底对比度） |
| 分隔线 | 淡墨（低于文字一档） | 暗褐（高于背景一档） |
| 阴影 | 极轻（0 4px 16px / 6%） | 中（0 4px 16px / 45%） |
| 金色 | 只做线/描边/图标，不做大面积底 | 同规则 |

**`-light` 后缀语义修正**：既有类名 `gold-light` / `jade-light` / `cinnabar-light` 原意为"更亮"，在亮底上会失效。映射规则改为 **"对比更强"**：亮底取更深值，暗底取更亮值。类名不变，语义升级为"强调档"。

## 3. Token 定义

### 3.1 语义层（新增，推荐新代码使用）

```css
/* light (default) */
[data-theme="light"] {
  --bg-app:        246 241 231;  /* 绢底      #F6F1E7 */
  --bg-sunken:     239 231 216;  /* 下沉区    #EFE7D8 */
  --surface-1:     251 247 239;  /* 纸面      #FBF7EF */
  --surface-2:     243 236 224;  /* 纸面次级  #F3ECE0 */
  --surface-3:     235 226 210;  /* 榻面      #EBE2D2 */
  --surface-4:     226 215 196;  /* 榻面悬停  #E2D7C4 */

  --text-1:         36  30  23;  /* 墨        #241E17 */
  --text-2:         90  79  66;  /* 淡墨      #5A4F42 */
  --text-3:        122 108  91;  /* 远墨      #7A6C5B */
  --text-muted:    150 136 118;  /* 苔        #968876 */

  --line-1:        222 211 190;  /* 淡墨线    #DED3BE */
  --line-2:        233 224 208;  /* 极淡线    #E9E0D0 */

  --accent-seal:   178  58  40;  /* 朱砂      #B23A28 */
  --accent-seal-strong: 152  44  28;
  --accent-gold:   168 130  44;  /* 金        #A8822C */
  --accent-gold-strong: 138 104  30;
  --accent-jade:    70 112  82;  /* 石绿      #467052 */
  --accent-jade-strong: 54  92  64;
  --accent-azure:   46  90 120;  /* 石青      #2E5A78 */
  --accent-ochre:  146  99  56;  /* 赭石      #926338 */
  --accent-violet: 104  76 152;  /* 紫（破/华盖）#684C98 */

  --shadow-panel: 0 4px 16px rgb(62 46 28 / 0.07);
  --shadow-raised: 0 2px 8px rgb(62 46 28 / 0.06);
  --shadow-seal: 0 2px 8px rgb(178 58 40 / 0.20);
}
```

```css
/* dark */
[data-theme="dark"] {
  --bg-app:         20  16  12;  /* 玄        #14100C */
  --bg-sunken:      13  10   7;  /* 深玄      #0D0A07 */
  --surface-1:      30  24  19;  /* 炭        #1E1813 */
  --surface-2:      42  34  26;  /* 陶        #2A221A */
  --surface-3:      56  46  35;  /* 陶亮      #382E23 */
  --surface-4:      70  58  44;  /* 陶悬停    #463A2C */

  --text-1:        233 223 204;  /* 宣纸      #E9DFCC */
  --text-2:        181 167 148;  /* 旧纸      #B5A794 */
  --text-3:        154 141 122;  /* 灰纸      #9A8D7A */
  --text-muted:    128 114  96;  /* 暗纸      #807260 */

  --line-1:         74  63  50;  /* 暗褐线    #4A3F32 */
  --line-2:         58  48  40;  /* 极暗线    #3A3028 */

  --accent-seal:   212  82  58;  /* 朱砂亮    #D4523A */
  --accent-seal-strong: 228 112  86;
  --accent-gold:   212 176  86;  /* 金亮      #D4B056 */
  --accent-gold-strong: 228 196 112;
  --accent-jade:   118 164 122;  /* 石绿亮    #76A47A */
  --accent-jade-strong: 138 186 142;
  --accent-azure:  118 164 202;  /* 石青亮    #76A4CA */
  --accent-ochre:  172 146 112;  /* 赭石亮    #AC9270 */
  --accent-violet: 170 142 226;  /* 紫亮      #AA8EE2 */

  --shadow-panel: 0 4px 16px rgb(0 0 0 / 0.45);
  --shadow-raised: 0 2px 8px rgb(0 0 0 / 0.35);
  --shadow-seal: 0 2px 10px rgb(212 82 58 / 0.28);
}
```

### 3.2 五行色（双主题成套）

| 五行 | light | dark | 说明 |
|------|-------|------|------|
| 木 | `#4A7A5C` | `#7CB48A` | 石绿系 |
| 火 | `#B23A28` | `#E0674A` | 朱砂系 |
| 土 | `#9C7328` | `#D0A94E` | 赭黄系 |
| 金 | `#8E8256` | `#CFC28F` | 金砂系（亮底压深防糊） |
| 水 | `#2E5A78` | `#7FADD6` | 石青系 |

### 3.3 兼容映射（旧类名 → 语义 token）

| 旧 Tailwind | 映射到 | 命中处数 |
|------------|-------|---------|
| `ink-900` | `--bg-app` | 1 |
| `ink-800` | `--surface-2` | 10 |
| `ink-700` | `--surface-3` | 12 |
| `ink-600` | `--surface-4` | 7 |
| `ink-500` | `--line-1` | 0（保留） |
| `parchment-100` | `--text-1` | 17 |
| `parchment-200` | `--text-2` | 1 |
| `parchment-300` | `--text-2` | 9 |
| `parchment-50` | `--text-1` | 0（保留） |
| `parchment-700` | `--text-1` | 0（保留） |
| `cinnabar` | `--accent-seal` | 58（含透明度） |
| `cinnabar-light` | `--accent-seal-strong` | |
| `gold` | `--accent-gold` | 82（含透明度） |
| `gold-light` | `--accent-gold-strong` | |
| `jade` | `--accent-jade` | 34（含透明度） |
| `jade-light` | `--accent-jade-strong` | |
| `bronze` | `--accent-ochre` | 30（含透明度） |
| 硬编码 `#7c5cbf` / `#b69cf0` | `--accent-violet` | 6 |
| 硬编码 `#6b9bc3` | `--accent-azure` | 5 |
| 硬编码 `#c9a84c` | `--accent-gold` | 3 |
| 硬编码 `#d4a017` | `--accent-gold-strong` | 1 |

### 3.4 排版与几何

- 字体栈不变（宋体正文 / 楷体标题 / 隶书干支），避免字重变化引发的行高错位
- 圆角保持 `rounded-sm`（2px）单一值；新增元素禁止引入新圆角档
- 描边：列表/卡片用 `1px` `--line-1`；选中态用 `2px` accent
- 阴影：亮色仅 `--shadow-panel` / `--shadow-raised`；禁止多层堆叠发光（暗色下 `glow-gold` 保留但降低强度）

## 4. 接口与运行时

```ts
// frontend/src/lib/theme/index.ts
export type Theme = 'light' | 'dark'
export const DEFAULT_THEME: Theme = 'light'
export const THEME_STORAGE_KEY = 'tianji.theme'

export function readStoredTheme(): Theme
export function applyTheme(theme: Theme): void      // 写 <html data-theme> + localStorage + Wails 标题栏 + color-scheme
export function initTheme(): Theme                  // 首次渲染前调用
export function toggleTheme(): Theme
export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }
```

- `applyTheme` 必须幂等，且同步设置 `document.documentElement.style.colorScheme`
- `initTheme` 在 `main.tsx` 顶层、`ReactDOM.createRoot` 之前执行
- `useTheme` 通过 `storage` 事件 + 内部订阅保证多窗口/热更新一致（Wails 单窗口，主要防 HMR 抖动）

## 5. 里程碑

| # | 里程碑 | 依赖 | 文件 | 验收 | 风险 | 回滚 |
|---|--------|------|------|------|------|------|
| M1 | Token 基建 | - | `style.css`、`tailwind.config.js` | 两主题变量齐备；`bg-gold/10` 等透明度类仍生效 | rgb 通道写法错误导致类名失效 | 还原两文件（单提交） |
| M2 | 主题运行时 | M1 | `lib/theme/index.ts`、`main.tsx` | 刷新后主题保持；无 FOUC | Wails API 不存在时抛错 | 移除初始化调用 |
| M3 | 切换 UI | M2 | `App.tsx`（导航切换钮）、`Settings.tsx`（主题卡片） | 点击即切；设置页显示当前态 | 移动端导航拥挤 | 仅保留设置页入口 |
| M4 | 组件对位 | M1 | 8 个 components + 4 个 pages | 明/暗均无死白、无隐形文字、无糊边 | 少数 `text-*` 对比不足 | 逐组件回滚 |
| M5 | 图表与原生同步 | M4 | `FiveElementRadar.tsx`、`main.go` | 雷达图随主题变色；启动无黑闪 | ECharts 读不到变量 | 图表退回固定暗色 |
| M6 | 响应式 | M4 | 全部页面 | 390px 无横向溢出；多列降级正确 | 断点取舍不当致桌面变松 | 恢复固定列数 |

## 6. Definition of Ready / Done

**DoR**
- 色值表与兼容映射表评审通过（本文 3.1–3.3）
- 截图基线留存（改造前 1280×800 暗色）

**DoD**
- `pnpm build`（tsc）零错误；`pnpm test` 全绿
- 4 张验收截图（明/暗 × 桌面/移动）人工检视无瑕疵
- `scripts/env-check.sh` 通过（不新增越界路径）
- 无新增依赖；`git diff --stat` 仅触及声明范围内的文件

## 7. Review Gate

- 视觉 Gate：截图对比 + 对比度抽检（正文/次级/强调各 1 组）
- 代码 Gate：无硬编码 hex 新增；无 `dark:` 双写；无 `!important`
- 性能 Gate：CSS 体积 ≤ 32KB（未压缩，实测 27.9KB / gzip 6.2KB）；无新增运行时依赖

## 8. 未决问题

| # | 问题 | 处置 |
|---|------|------|
| Q1 | 是否提供"跟随系统"第三态？ | 本期不做，`Theme` 类型预留不可变；后续加 `'system'` 仅需扩 union + media query 分支 |
| Q2 | 暗色是否保留 `glow-gold` 发光？ | 保留但强度减半，亮色下禁用发光（改用实线描边） |
| Q3 | 打印/导出是否需要亮色固定？ | 导出为 JSON 文本，不涉及；`@media print` 强制亮色 token 待后续 |
