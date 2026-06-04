import type { BaziResult } from '../bazi/types'

interface FormData {
  name?: string
  gender: number
  year: number
  month: number
  day: number
  hour: number
  calendar: number
}

const HOUR_LABELS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export function generatePrompt(result: BaziResult, form: FormData): string {
  const genderStr = form.gender === 0 ? '男' : '女'
  const calendarStr = form.calendar === 0 ? '阳历' : '阴历'
  const hourLabel = HOUR_LABELS[form.hour] || ''

  let prompt = `你是一位精通子平八字理论的命理分析师，拥有深厚的五行生克制化知识和丰富的实践经验。请根据以下八字命盘进行专业分析。

## 基本信息
- 性别：${genderStr}
- 出生：${form.year}年${form.month}月${form.day}日 ${hourLabel}时（${calendarStr}）
${form.name ? `- 备注：${form.name}` : ''}

## 四柱
| 年柱 | 月柱 | 日柱 | 时柱 |
|------|------|------|------|
| ${result.yearStem}${result.yearBranch} | ${result.monthStem}${result.monthBranch} | ${result.dayStem}${result.dayBranch} | ${result.hourStem}${result.hourBranch} |

## 日主
${result.dayStem}（${result.dayMasterElement || ''}）
`

  if (result.tenGods && result.tenGods.length > 0) {
    prompt += `
## 十神
${result.tenGods.join('、')}
`
  }

  if (result.spirits && result.spirits.length > 0) {
    prompt += `
## 神煞
${result.spirits.join('、')}
`
  }

  if (result.luck && result.luck.length > 0) {
    prompt += `
## 大运
${result.luck.map(l => `${l.startAge}-${l.endAge}岁: ${l.stem}${l.branch}`).join(' → ')}
`
  }

  prompt += `
## 请从以下维度进行综合分析：
1. 日主旺衰与格局判断
2. 性格特质分析
3. 事业与财运
4. 婚恋与感情
5. 健康提示
6. 当前大运与流年吉凶
7. 未来3-5年运势趋势与具体建议

请尽量结合传统命理理论进行专业、详细的分析，并给出实用建议。`

  return prompt
}
