import type { BaziResult, BaziInput } from '../bazi/types'

const HOUR_LABELS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

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

export function generatePrompt(result: BaziResult, input: BaziInput, template: PromptTemplate = 'comprehensive'): string {
  const genderStr = input.gender === 0 ? '男' : '女'
  const calendarStr = input.calendar === 0 ? '阳历' : '阴历'
  const hourLabel = HOUR_LABELS[input.hour] || ''
  const p = result.pillars

  let prompt = `你是一位精通子平八字理论的命理分析师，拥有深厚的五行生克制化、十神配置、格局用神知识和丰富的实践经验。请根据以下八字命盘进行专业分析。

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
| 地势 | ${p.year.diShi} | ${p.month.diShi} | ${p.day.diShi} | ${p.time.diShi} |

## 日主信息
- 日主：${result.dayMaster}（${result.dayMasterWuXing}）
- 身强/身弱指数：${result.yuanHaiZiping.shenQiang}（湿度：${result.yuanHaiZiping.shidu}）

## 五行力量
| 木 | 火 | 土 | 金 | 水 |
|---|---|---|---|---|
| ${result.wuXingPower['木'] || 0} | ${result.wuXingPower['火'] || 0} | ${result.wuXingPower['土'] || 0} | ${result.wuXingPower['金'] || 0} | ${result.wuXingPower['水'] || 0} |
`

  // Special pillars
  prompt += `
## 特殊宫位
- 胎元：${result.taiYuan}（${result.taiYuanNaYin}）
- 胎息：${result.taiXi}（${result.taiXiNaYin}）
- 命宫：${result.mingGong}（${result.mingGongNaYin}）
- 身宫：${result.shenGong}（${result.shenGongNaYin}）
`

  // Fortune periods
  if (result.dayunArr && result.dayunArr.length > 0) {
    prompt += `
## 大运
| 大运 | 天干十神 | 地支十神 | 起始年 |
|---|---|---|---|
`
    for (const dy of result.dayunArr.slice(0, 9)) {
      prompt += `| ${dy.ganZhi} | ${dy.ganshen} | ${dy.zhishen} | ${dy.startYear} |\n`
    }
  }

  // Current fortune
  if (result.currentYun?.daYun) {
    const dy = result.currentYun.daYun
    const ganZhiStr = Array.isArray(dy.ganZhi) ? dy.ganZhi.join('') : dy.ganZhi
    prompt += `
## 当前运势
- 当前大运：${ganZhiStr}（${dy.startYear}-${dy.endYear}）
`
    if (result.currentYun.liuNian) {
      const ln = result.currentYun.liuNian
      const lnGanZhi = Array.isArray(ln.ganZhi) ? ln.ganZhi.join('') : ln.ganZhi
      prompt += `- 当前流年：${lnGanZhi}（${ln.year}年，${ln.age}岁）\n`
    }
  }

  // Analysis hints from library
  if (result.analysis.XiYongShen && result.analysis.XiYongShen.length > 0) {
    prompt += `
## 喜用神参考
${result.analysis.XiYongShen.join('\n')}
`
  }

  // Gan/Zhi relations
  if (result.ganRelations && result.ganRelations.length > 0) {
    prompt += `
## 天干关系
${result.ganRelations.map((r: any) => typeof r === 'string' ? r : JSON.stringify(r)).join('、')}
`
  }
  if (result.zhiRelations && result.zhiRelations.length > 0) {
    prompt += `
## 地支关系
${result.zhiRelations.map((r: any) => typeof r === 'string' ? r : JSON.stringify(r)).join('、')}
`
  }

  // Instructions
  prompt += `
---
## 分析要求
${TEMPLATE_INSTRUCTIONS[template]}
`

  return prompt
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
