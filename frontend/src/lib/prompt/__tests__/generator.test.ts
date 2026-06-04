import { describe, it, expect } from 'vitest'
import { generatePrompt, getTemplateList } from '../generator'
import { calculateBazi } from '../../bazi/calculator'
import type { BaziInput } from '../../bazi/types'

describe('generatePrompt', () => {
  const input: BaziInput = {
    name: '测试用户',
    year: 1990,
    month: 6,
    day: 15,
    hour: 3,
    gender: 0,
    calendar: 0,
  }

  const result = calculateBazi(input)

  it('should generate a non-empty prompt string', () => {
    const prompt = generatePrompt(result, input)
    expect(prompt.length).toBeGreaterThan(200)
  })

  it('should include basic info in prompt', () => {
    const prompt = generatePrompt(result, input)
    expect(prompt).toContain('男')
    expect(prompt).toContain('1990')
    expect(prompt).toContain('测试用户')
  })

  it('should include four pillars table', () => {
    const prompt = generatePrompt(result, input)
    expect(prompt).toContain('年柱')
    expect(prompt).toContain('月柱')
    expect(prompt).toContain('日柱')
    expect(prompt).toContain('时柱')
    expect(prompt).toContain(result.dayGan)
  })

  it('should include five elements power', () => {
    const prompt = generatePrompt(result, input)
    expect(prompt).toContain('木')
    expect(prompt).toContain('火')
    expect(prompt).toContain('五行力量')
  })

  it('should include analysis instructions', () => {
    const prompt = generatePrompt(result, input, 'comprehensive')
    expect(prompt).toContain('日主旺衰')
    expect(prompt).toContain('事业')
  })

  it('should generate different prompts for different templates', () => {
    const comprehensive = generatePrompt(result, input, 'comprehensive')
    const career = generatePrompt(result, input, 'career')
    const brief = generatePrompt(result, input, 'brief')

    expect(career).toContain('事业')
    expect(career).toContain('财运')
    expect(brief).toContain('简洁')
    expect(comprehensive).not.toEqual(career)
  })

  it('should include shensha if present', () => {
    const prompt = generatePrompt(result, input)
    if (result.shensha?.nian?.length || result.shensha?.yue?.length) {
      expect(prompt).toContain('神煞')
    }
  })
})

describe('getTemplateList', () => {
  it('should return 6 templates', () => {
    const list = getTemplateList()
    expect(list.length).toBe(6)
  })

  it('should have key and label for each template', () => {
    const list = getTemplateList()
    for (const item of list) {
      expect(item.key).toBeTruthy()
      expect(item.label).toBeTruthy()
    }
  })
})
