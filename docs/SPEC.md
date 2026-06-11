# TianJi-SiZhu 项目技术规格说明书

> **天机四柱** — 开源四柱排盘，为 AI 解读而生

**版本**: v1.1.0
**日期**: 2026-06-11
**状态**: Released

---

## 1. 项目概述

### 1.1 定位

一款开源的八字（四柱）排盘桌面客户端，集成美观可视化界面、完整神煞大运系统、本地数据持久化，以及面向 AI 大模型的结构化 Prompt 生成能力。

### 1.2 核心差异化

| 维度 | 现有工具痛点 | TianJi 解法 |
|------|-------------|-------------|
| 界面 | 功能堆砌，缺少美感 | 国风美学 + 现代数据可视化 |
| 完整性 | 神煞/大运缺失或不全 | 基于 mystilight-8char 完整算法 |
| 数据 | 无法保存/导出 | SQLite 本地存储 + JSON 导出 |
| AI | 需手动整理复制 | 一键生成结构化 Prompt |
| 部署 | Web 依赖网络 | 原生桌面客户端，离线可用 |

### 1.3 目标用户

- 命理学习者 & 爱好者
- 使用 AI 辅助命理分析的探索者
- 需要批量管理案例的命理师
- 对命理算法感兴趣的开发者

---

## 2. 技术架构

### 2.1 技术栈

```
┌─────────────────────────────────────────────┐
│              TianJi Desktop App             │
├─────────────────────────────────────────────┤
│  Frontend (WebView)                         │
│  ├── React 18 + TypeScript                  │
│  ├── mystilight-8char (排盘核心算法)         │
│  ├── TailwindCSS (样式)                     │
│  ├── ECharts / D3.js (数据可视化)           │
│  └── Vite (构建工具)                        │
├─────────────────────────────────────────────┤
│  Wails Runtime (Go ↔ JS Bridge)            │
├─────────────────────────────────────────────┤
│  Backend (Go)                               │
│  ├── SQLite (go-sqlite3 / modernc-sqlite)   │
│  ├── 剪贴板操作                              │
│  ├── 文件系统 (导入/导出)                    │
│  └── 系统原生交互 (对话框/通知)              │
└─────────────────────────────────────────────┘
```

### 2.2 职责划分

| 层 | 技术 | 职责 |
|----|------|------|
| Frontend | React + TS | UI 渲染、排盘计算（调用 mystilight-8char）、Prompt 组装、可视化图表 |
| Bridge | Wails Binding | 前后端通信（Go 函数暴露给 JS 调用） |
| Backend | Go | 数据持久化（SQLite CRUD）、文件导入导出、剪贴板写入、系统集成 |

### 2.3 为什么是这个架构

- **Wails**：比 Electron 轻量 10x+，原生 WebView 无需打包 Chromium，最终产物 ~10MB
- **mystilight-8char 在前端**：纯 JS 无依赖，WebView 中直接 import 零成本，避免跨语言绑定
- **Go 后端**：SQLite 操作、文件 I/O、系统交互由 Go 处理，比纯前端更可靠
- **React**：生态丰富，大量可参考的国风 UI 组件和图表库

---

## 3. 功能模块设计

### 3.1 排盘核心（P0 - MVP 必须）

| 功能 | 描述 |
|------|------|
| 基础排盘 | 输入出生年月日时 → 输出四柱（年柱/月柱/日柱/时柱） |
| 天干地支 | 完整天干地支显示，含藏干 |
| 十神系统 | 基于日主的十神关系计算与展示 |
| 五行分析 | 五行旺衰、得分统计 |
| 纳音 | 四柱纳音显示 |
| 大运排列 | 根据性别和年干阴阳排出大运序列 |
| 流年 | 当前及未来流年排列 |
| 神煞系统 | 完整神煞计算（天乙贵人、驿马、桃花、华盖等） |
| 刑冲合害 | 地支关系分析（三合、六合、相冲、相刑、相害） |

### 3.2 可视化界面（P0 - MVP 必须）

| 组件 | 描述 |
|------|------|
| 命盘主视图 | 四柱信息的结构化卡片展示，清晰层次 |
| 五行雷达图 | ECharts 雷达图展示五行旺衰分布 |
| 大运时间轴 | 横向时间轴展示大运流转 |
| 神煞标签 | 彩色标签分类展示各柱神煞 |
| 关系连线图 | 天干地支间的刑冲合害关系可视化 |

### 3.3 数据管理（P0 - MVP 必须）

| 功能 | 描述 |
|------|------|
| 保存排盘 | 将排盘结果保存到本地 SQLite |
| 案例列表 | 浏览、搜索、删除已保存的排盘记录 |
| JSON 导出 | 导出单条/批量排盘数据为 JSON 文件 |
| JSON 导入 | 从 JSON 文件导入排盘记录 |

### 3.4 AI Prompt 生成（P0 - MVP 必须）

| 功能 | 描述 |
|------|------|
| Prompt 模板 | 内置结构化提示词模板（角色定义 + 数据 + 指令） |
| 动态填充 | 排盘数据自动填入模板 |
| 一键复制 | 点击按钮将完整 Prompt 写入系统剪贴板 |
| 模板可选 | 提供多种 Prompt 风格（简洁版/详尽版/特定主题） |

### 3.5 未来扩展（P1 - 后续迭代）

- 多主题切换（国风暗色/淡雅浅色/极简现代）
- 批量排盘（导入 CSV 批量生成）
- 八字对比（双人合盘）
- 内置 AI 直连（可选配置 API Key 后应用内直接获得解读）
- 打印/PDF 导出
- macOS / Linux 跨平台支持

---

## 4. 数据模型

### 4.1 SQLite Schema

```sql
CREATE TABLE charts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,          -- 案例名称/备注
    gender      INTEGER NOT NULL,       -- 0=男, 1=女
    birth_year  INTEGER NOT NULL,
    birth_month INTEGER NOT NULL,
    birth_day   INTEGER NOT NULL,
    birth_hour  INTEGER NOT NULL,       -- 时辰索引 0-11
    calendar    INTEGER DEFAULT 0,      -- 0=阳历, 1=阴历
    chart_data  TEXT NOT NULL,          -- 排盘结果 JSON (完整快照)
    notes       TEXT DEFAULT '',        -- 用户备注
    created_at  TEXT NOT NULL,          -- ISO 8601
    updated_at  TEXT NOT NULL           -- ISO 8601
);

CREATE INDEX idx_charts_name ON charts(name);
CREATE INDEX idx_charts_created ON charts(created_at);
```

### 4.2 chart_data JSON 结构（核心数据模型）

```jsonc
{
  "fourPillars": {
    "year":  { "stem": "甲", "branch": "子", "hiddenStems": ["癸"], "nayin": "海中金" },
    "month": { "stem": "丙", "branch": "寅", "hiddenStems": ["甲","丙","戊"], "nayin": "炉中火" },
    "day":   { "stem": "戊", "branch": "辰", "hiddenStems": ["戊","乙","癸"], "nayin": "大林木" },
    "hour":  { "stem": "壬", "branch": "戌", "hiddenStems": ["戊","辛","丁"], "nayin": "大海水" }
  },
  "dayMaster": "戊",
  "tenGods": {
    "year": { "stem": "七杀", "branch": "偏财" },
    "month": { "stem": "偏印", "branch": "七杀" },
    "day": { "stem": "—", "branch": "比肩" },
    "hour": { "stem": "偏财", "branch": "比肩" }
  },
  "fiveElements": {
    "wood": { "count": 2, "score": 15.5 },
    "fire": { "count": 1, "score": 8.0 },
    "earth": { "count": 3, "score": 25.0 },
    "metal": { "count": 1, "score": 6.5 },
    "water": { "count": 2, "score": 12.0 }
  },
  "luck": {
    "startAge": 3,
    "direction": "forward",
    "periods": [
      { "stem": "乙", "branch": "丑", "startAge": 3, "endAge": 12 }
      // ...
    ]
  },
  "spirits": [
    { "name": "天乙贵人", "pillar": "year", "position": "branch" },
    { "name": "驿马", "pillar": "month", "position": "branch" }
    // ...
  ],
  "relations": {
    "branchRelations": [
      { "type": "六合", "branches": ["子", "丑"] }
      // ...
    ],
    "stemRelations": [
      { "type": "相合", "stems": ["甲", "己"] }
      // ...
    ]
  }
}
```

---

## 5. AI Prompt 模板设计

### 5.1 模板结构

```
[角色定义]
你是一位精通子平八字理论的命理分析师，拥有深厚的五行生克制化知识...

[命盘数据]
## 基本信息
- 性别：{gender}
- 出生：{birth_datetime}（{calendar}）

## 四柱
{formatted_four_pillars}

## 十神
{formatted_ten_gods}

## 五行旺衰
{formatted_five_elements}

## 大运
{formatted_luck_periods}

## 神煞
{formatted_spirits}

## 刑冲合害
{formatted_relations}

[分析指令]
请从以下维度进行综合分析：
1. 日主旺衰与格局判断
2. 性格特质
3. 事业财运
4. 婚恋感情
5. 健康提示
6. 当前大运与流年吉凶
7. 未来 3-5 年运势趋势与建议
```

### 5.2 模板变体

| 模板名 | 用途 |
|--------|------|
| `comprehensive` | 综合全面分析（默认） |
| `career` | 聚焦事业财运 |
| `relationship` | 聚焦婚恋感情 |
| `health` | 聚焦健康养生 |
| `yearly` | 当年流年运势专项 |
| `brief` | 精简概要（token 友好） |

---

## 6. 项目结构

```
tianji-sizhu/
├── build/                    # Wails 构建产物
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── components/       # UI 组件
│   │   │   ├── ChartView/    # 命盘主视图
│   │   │   ├── Timeline/     # 大运时间轴
│   │   │   ├── RadarChart/   # 五行雷达图
│   │   │   ├── SpiritTags/   # 神煞标签
│   │   │   └── RelationMap/  # 关系图
│   │   ├── hooks/            # 自定义 hooks
│   │   ├── lib/
│   │   │   ├── bazi/         # mystilight-8char 封装层
│   │   │   └── prompt/       # Prompt 模板与生成逻辑
│   │   ├── pages/            # 页面
│   │   │   ├── Home/         # 排盘输入页
│   │   │   ├── Result/       # 排盘结果页
│   │   │   ├── Records/      # 历史记录页
│   │   │   └── Settings/     # 设置页
│   │   ├── stores/           # 状态管理
│   │   ├── styles/           # 全局样式 & 主题
│   │   ├── types/            # TypeScript 类型定义
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── internal/                 # Go 内部包
│   ├── database/             # SQLite 操作
│   ├── clipboard/            # 剪贴板
│   └── export/               # 文件导入导出
├── app.go                    # Wails App 主文件 (暴露 Binding)
├── main.go                   # 入口
├── wails.json                # Wails 配置
├── go.mod
├── go.sum
├── LICENSE
├── README.md
├── SPEC.md                   # 本文件
└── CHANGELOG.md
```

---

## 7. 开发里程碑

### Phase 1: 基础骨架（Week 1-2）

- [ ] Wails 项目初始化 + React + Vite 脚手架
- [ ] mystilight-8char 集成与封装层
- [ ] 基础排盘输入表单 → 四柱输出
- [ ] Go 后端 SQLite 初始化 + CRUD binding

### Phase 2: 核心功能（Week 3-4）

- [ ] 完整排盘结果展示（十神/五行/大运/神煞）
- [ ] 命盘主视图 UI 组件开发
- [ ] 五行雷达图（ECharts）
- [ ] 大运时间轴组件
- [ ] 保存/读取排盘记录

### Phase 3: AI 与体验（Week 5-6）

- [ ] Prompt 模板系统 + 动态填充
- [ ] 一键复制到剪贴板
- [ ] 神煞标签可视化
- [ ] 关系连线图
- [ ] 历史记录列表页 + 搜索

### Phase 4: 打磨发布（Week 7-8）

- [ ] UI 美化与国风主题
- [ ] JSON 导入/导出
- [ ] 设置页面
- [ ] Windows x64 构建 + 安装包
- [ ] README + 使用文档
- [ ] GitHub Release v0.1.0

---

## 8. 非功能需求

| 项 | 要求 |
|----|------|
| 启动时间 | < 2s |
| 排盘计算 | < 100ms |
| 安装包体积 | < 20MB |
| 内存占用 | < 100MB |
| 离线可用 | 全部核心功能不依赖网络 |
| 系统要求 | Windows 10+ x64 |

---

## 9. 技术风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| mystilight-8char 算法准确性存疑 | 排盘结果不可信 | 对照已知案例验证，发现问题提 issue 或 fork 修复 |
| mystilight-8char 停止维护 | 长期依赖风险 | 封装层隔离，未来可替换为自研算法 |
| Wails WebView 兼容性 | 部分 Windows 版本 WebView2 缺失 | 打包时嵌入 WebView2 runtime |
| 国风 UI 开发成本 | 美术资源不足 | 优先功能完整，渐进美化，参考开源国风组件库 |

---

## 10. 开源协议与贡献

- **协议**：按已有 LICENSE 文件执行
- **贡献**：欢迎 PR，需遵循项目代码规范
- **国际化**：一期中文优先，预留 i18n 架构

---

*此文档将随项目演进持续更新。*

---

## 附录 A: 变更日志

### v1.1.0 (2026-06-11)

**全面增强：交互式排盘 + 完整 AI Prompt + 详细分析面板**

#### 🆕 新功能

- **大运交互查看**：点击任意大运期间查看该十年流年列表
- **流年选择**：点击流年查看当年神煞、生克关系
- **12 月流月面板**：选择流年后展示 12 个月干支、十神、神煞，点击月份展开详情
- **记录点击查看**：保存的排盘记录单击即可重新排盘查看详情
- **起运信息面板**：显示顺/逆排、起运年龄、起运阳历时间
- **详细分析面板**（手风琴折叠式）：
  - 渊海子平详解：月令分析、太岁分析、身强弱分解、阴阳平衡、寒暖燥湿分解
  - 经典断语：三命通会全文、日时断语
  - 配偶信息：外貌评分与详细描述
  - 家庭背景：祖辈/父母分析
  - 个人特质：外貌评分、异性缘
  - 学历与天赋：学历评分、天赋评分

#### 🔧 增强

- **四柱排盘**：新增自坐（ziZuo）、行运支（xingYunZhi）、旬空列
- **特殊宫位**：显示纳音
- **神煞面板**：新增流月神煞、流日神煞
- **Prompt 生成器**全面增强：
  - 十年流年总览表（干支、十神、大运/流年神煞）
  - 流月详情（12 月生克分析）
  - 起运信息（方向/年龄/时间）
  - 大运/流年/流月/流日地支藏干十神详情
  - 渊海子平详解（月令/太岁/用神得力）
  - 配偶/家庭/个人/学历分析
  - 三命通会 + 日时断语全文
  - 身强弱分解 + 阴阳平衡 + 寒暖燥湿
- **架构优化**：Prompt 生成器采用 Section Builder 模式，新增功能只需添加 build*() 函数

#### 📦 构建

- 版本号升级至 v1.1.0
- GitHub Actions 自动发布流程

### v1.0.0 (2026-06-06)

**初始发布版本**

- 四柱排盘基础功能
- 大运时间轴展示
- 神煞、天干/地支关系展示
- 五行雷达图
- AI Prompt 生成与复制（6 种模板）
- 排盘记录保存与管理
- SQLite 本地数据持久化
- Windows x64 桌面客户端
