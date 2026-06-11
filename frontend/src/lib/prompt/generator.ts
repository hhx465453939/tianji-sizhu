import type { BaziResult, BaziInput, PromptContext } from '../bazi/types'

const HOUR_LABELS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const MONTH_CN = ['', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']

export type PromptTemplate = 'comprehensive' | 'career' | 'relationship' | 'health' | 'yearly' | 'brief'

const TEMPLATE_INSTRUCTIONS: Record<PromptTemplate, string> = {
  comprehensive: `请从以下维度进行综合分析：
1. 日主旺衰与格局判断
2. 性格特质分析
3. 事业与财运
4. 婚恋与感情
5. 健康提示
6. 当前大运与流年吉凶
7. 未来3-5年运势趋势与具体建议

请尽量结合传统命理理论进行专业、详细的分析，并给出实用建议。`,

  career: `请聚焦事业与财运方面进行深入分析：
1. 命局中财星与官杀的配置
2. 适合的行业方向（结合喜用神五行）
3. 事业发展的高峰期与低谷期
4. 偏财运与正财运的特点
5. 合作/独立创业的适合度
6. 当前大运对事业的影响及建议`,

  relationship: `请聚焦婚恋与人际关系进行深入分析：
1. 命局中的婚恋宫位与星曜
2. 配偶特征与缘分时间
3. 感情中的优势与需注意的问题
4. 桃花运的时间节点
5. 婚姻稳定性分析
6. 当前大运对感情的影响及建议`,

  health: `请聚焦健康养生进行分析：
1. 命局五行偏枯对应的身体弱点
2. 需要注意的器官与疾病倾向
3. 适合的养生方向（饮食/运动/作息）
4. 健康风险较高的大运/流年时段
5. 日常保健建议`,

  yearly: `请聚焦当前流年运势进行详细分析：
1. 今年流年干支与命局的作用关系
2. 事业/财运/感情/健康各维度的流年表现
3. 每季度的运势起伏
4. 需要特别注意的月份
5. 趋吉避凶的具体建议`,

  brief: `请用简洁的语言概括分析：
1. 格局与日主强弱（一句话）
2. 核心性格（三个关键词）
3. 事业方向建议
4. 当前运势一句话总结
5. 最重要的一条建议`,
}

// ── Section builders ──────────────────────────────────────────────
// Each builder appends to `sections[]` independently.
// To add a new feature to the prompt, add a new builder here
// and call it in generatePrompt().

function buildBaseInfo(input: BaziInput, result: BaziResult): string {
  const genderStr = input.gender === 0 ? '男' : '女'
  const calendarStr = input.calendar === 0 ? '阳历' : '阴历'
  const hourLabel = HOUR_LABELS[input.hour] || ''
  const p = result.pillars

  return `你是一位精通子平八字理论的命理分析师，拥有深厚的五行生克制化、十神配置、格局用神知识和丰富的实践经验。请根据以下八字命盘进行专业分析。

## 基本信息
- 性别：${genderStr}
- 出生：${input.year}年${input.month}月${input.day}日 ${hourLabel}时（${calendarStr}）
${input.name ? `- 备注：${input.name}` : ''}

## 四柱排盘
| | 年柱 | 月柱 | 日柱 | 时柱 |
|---|---|---|---|---|
| 天干 | ${p.year.gan} | ${p.month.gan} | ${p.day.gan}（日主） | ${p.time.gan} |
| 地支 | ${p.year.zhi} | ${p.month.zhi} | ${p.day.zhi} | ${p.time.zhi} |
| 藏干 | ${p.year.hideGan} | ${p.month.hideGan} | ${p.day.hideGan} | ${p.time.hideGan} |
| 十神(干) | ${p.year.shiShenGan} | ${p.month.shiShenGan} | — | ${p.time.shiShenGan} |
| 十神(支) | ${p.year.shiShenZhi} | ${p.month.shiShenZhi} | ${p.day.shiShenZhi} | ${p.time.shiShenZhi} |
| 纳音 | ${p.year.naYin} | ${p.month.naYin} | ${p.day.naYin} | ${p.time.naYin} |
| 地势 | ${p.year.diShi} | ${p.month.diShi} | ${p.day.diShi} | ${p.time.diShi} |`
}

function buildDayMaster(result: BaziResult): string {
  return `
## 日主信息
- 日主：${result.dayMaster}（${result.dayMasterWuXing}）
- 身强/身弱：${typeof result.yuanHaiZiping.shenQiang === 'object' ? `${result.yuanHaiZiping.shenQiang.judge}（得分${result.yuanHaiZiping.shenQiang.score}/阈值${result.yuanHaiZiping.shenQiang.threshold}）` : result.yuanHaiZiping.shenQiang}
- 寒暖燥湿：${typeof result.yuanHaiZiping.shidu === 'object' ? `${result.yuanHaiZiping.shidu.judge}（得分${result.yuanHaiZiping.shidu.score}）` : result.yuanHaiZiping.shidu}

## 五行力量
| 木 | 火 | 土 | 金 | 水 |
|---|---|---|---|---|
| ${result.wuXingPower['木'] || 0} | ${result.wuXingPower['火'] || 0} | ${result.wuXingPower['土'] || 0} | ${result.wuXingPower['金'] || 0} | ${result.wuXingPower['水'] || 0} |`
}

function buildSpecialPillars(result: BaziResult): string {
  return `
## 特殊宫位
- 胎元：${result.taiYuan}（${result.taiYuanNaYin}）
- 胎息：${result.taiXi}（${result.taiXiNaYin}）
- 命宫：${result.mingGong}（${result.mingGongNaYin}）
- 身宫：${result.shenGong}（${result.shenGongNaYin}）`
}

function buildDaYun(result: BaziResult): string {
  if (!result.dayunArr || result.dayunArr.length === 0) return ''
  let s = '\n## 大运\n| 大运 | 天干十神 | 地支十神 | 起始年 |\n|---|---|---|---|\n'
  for (const dy of result.dayunArr.slice(0, 9)) {
    s += `| ${dy.ganZhi} | ${dy.ganshen} | ${dy.zhishen} | ${dy.startYear} |\n`
  }
  return s
}

function buildCurrentFortune(result: BaziResult, ctx?: PromptContext): string {
  // If context has a selected DaYun/LiuNian, use that; otherwise use default current
  const dy = ctx?.selectedDaYun
    ? { ganZhi: Array.isArray(ctx.selectedDaYun.ganZhi) ? ctx.selectedDaYun.ganZhi.join('') : ctx.selectedDaYun.ganZhi, startYear: ctx.selectedDaYun.startYear, endYear: ctx.selectedDaYun.startYear + 9 }
    : result.currentYun?.daYun
      ? { ganZhi: Array.isArray(result.currentYun.daYun.ganZhi) ? result.currentYun.daYun.ganZhi.join('') : result.currentYun.daYun.ganZhi, startYear: result.currentYun.daYun.startYear, endYear: result.currentYun.daYun.endYear }
      : null

  if (!dy) return ''

  let s = `\n## 当前运势\n- 当前大运：${dy.ganZhi}（${dy.startYear}-${dy.endYear}）\n`

  // LiuNian
  const ln = ctx?.selectedLiuNian || (result.currentYun?.liuNian ? { year: result.currentYun.liuNian.year, ganZhi: Array.isArray(result.currentYun.liuNian.ganZhi) ? result.currentYun.liuNian.ganZhi.join('') : result.currentYun.liuNian.ganZhi, ganshen: '', zhishen: '' } : null)
  if (ln) {
    s += `- 当前流年：${Array.isArray(ln.ganZhi) ? ln.ganZhi.join('') : ln.ganZhi}（${ln.year}年）\n`
  }

  return s
}

/** NEW: Selected LiuNian shensha detail */
function buildLiuNianShensha(ctx?: PromptContext): string {
  if (!ctx?.liunianShensha) return ''

  const lines: string[] = []
  if (ctx.liunianShensha.daYun?.length) {
    lines.push(`大运神煞：${ctx.liunianShensha.daYun.join('、')}`)
  }
  if (ctx.liunianShensha.liuNian?.length) {
    lines.push(`流年神煞：${ctx.liunianShensha.liuNian.join('、')}`)
  }

  if (lines.length === 0) return ''

  return `\n## 流年运势神煞\n${lines.join('\n')}`
}

/** NEW: 12-month LiuYue detail */
function buildLiuYue(ctx?: PromptContext): string {
  if (!ctx?.liuYueArr || ctx.liuYueArr.length === 0) return ''

  let s = '\n## 流月（12月）\n| 月份 | 干支 | 十神 | 神煞 |\n|---|---|---|---|\n'
  for (const my of ctx.liuYueArr) {
    const shenshaStr = my.liuYueShensha.length > 0 ? my.liuYueShensha.join('、') : '—'
    s += `| ${MONTH_CN[my.month]} | ${my.ganZhi} | ${my.shiShen} | ${shenshaStr} |\n`
  }

  // Highlight selected month
  if (ctx.selectedLiuYueMonth && ctx.liuYueArr[ctx.selectedLiuYueMonth - 1]) {
    const sel = ctx.liuYueArr[ctx.selectedLiuYueMonth - 1]
    if (sel.liuYueShensha.length > 0) {
      s += `\n**重点关注月份**：${sel.ganZhi}（${MONTH_CN[sel.month]}），神煞：${sel.liuYueShensha.join('、')}\n`
    }
  }

  return s
}

function buildShensha(result: BaziResult, ctx?: PromptContext): string {
  if (!result.shensha) return ''

  const lines: string[] = []
  if (result.shensha.nian?.length) lines.push(`年柱：${result.shensha.nian.join('、')}`)
  if (result.shensha.yue?.length) lines.push(`月柱：${result.shensha.yue.join('、')}`)
  if (result.shensha.ri?.length) lines.push(`日柱：${result.shensha.ri.join('、')}`)
  if (result.shensha.shi?.length) lines.push(`时柱：${result.shensha.shi.join('、')}`)

  // Append current shensha from context if available
  if (ctx?.liunianShensha) {
    if (ctx.liunianShensha.daYun?.length) lines.push(`大运：${ctx.liunianShensha.daYun.join('、')}`)
    if (ctx.liunianShensha.liuNian?.length) lines.push(`流年：${ctx.liunianShensha.liuNian.join('、')}`)
  } else if (result.shensha.current) {
    if (result.shensha.current.daYun?.length) lines.push(`大运：${result.shensha.current.daYun.join('、')}`)
    if (result.shensha.current.liuNian?.length) lines.push(`流年：${result.shensha.current.liuNian.join('、')}`)
  }

  if (lines.length === 0) return ''

  return `\n## 神煞\n${lines.join('\n')}`
}

function buildRelations(result: BaziResult): string {
  let s = ''
  if (result.ganRelations && result.ganRelations.length > 0) {
    s += `\n## 天干关系\n${result.ganRelations.map((r: any) => typeof r === 'string' ? r : (r.desc || JSON.stringify(r))).join('、')}\n`
  }
  if (result.zhiRelations && result.zhiRelations.length > 0) {
    s += `\n## 地支关系\n${result.zhiRelations.map((r: any) => typeof r === 'string' ? r : (r.desc || JSON.stringify(r))).join('、')}\n`
  }
  return s
}

function buildAnalysis(result: BaziResult): string {
  if (!result.analysis.XiYongShen || result.analysis.XiYongShen.length === 0) return ''
  const xiyong = result.analysis.XiYongShen.map((s: any) =>
    typeof s === 'string' ? s : (s?.judge || JSON.stringify(s))
  )
  return `\n## 喜用神参考\n${xiyong.join('\n')}`
}

// ── Main generator ────────────────────────────────────────────────

export function generatePrompt(
  result: BaziResult,
  input: BaziInput,
  template: PromptTemplate = 'comprehensive',
  context?: PromptContext,
): string {
  const sections: string[] = [
    buildBaseInfo(input, result),
    buildDayMaster(result),
    buildSpecialPillars(result),
    buildDaYun(result),
    buildCurrentFortune(result, context),
    buildLiuNianShensha(context),   // NEW: selected liunian shensha
    buildLiuYue(context),            // NEW: 12-month detail
    buildAnalysis(result),
    buildRelations(result),
    buildShensha(result, context),   // ENHANCED: includes context shensha
  ]

  // Filter out empty sections
  const body = sections.filter(s => s.trim() !== '').join('\n')

  return `${body}

---
## 分析要求
${TEMPLATE_INSTRUCTIONS[template]}
`
}

export function getTemplateList(): { key: PromptTemplate; label: string }[] {
  return [
    { key: 'comprehensive', label: '综合分析' },
    { key: 'career', label: '事业财运' },
    { key: 'relationship', label: '婚恋感情' },
    { key: 'health', label: '健康养生' },
    { key: 'yearly', label: '流年运势' },
    { key: 'brief', label: '精简概要' },
  ]
}
