import { useState } from 'react'
import type { BaziResult } from '../lib/bazi/types'

interface Props {
  result: BaziResult
}

/** Accordion section component */
function Accordion({ title, defaultOpen = false, children }: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="overflow-hidden rounded-sm border border-line-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-surface-3/40 px-4 py-2.5 text-left transition-colors hover:bg-surface-4/45"
      >
        <span className="flex items-center gap-2">
          <span className="h-3 w-[2px] bg-accent-seal/70" aria-hidden="true" />
          <span className="font-heading text-sm tracking-wide-cn text-accent-gold">{title}</span>
        </span>
        <span className={`text-xs text-[var(--text-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-line-2 px-4 py-3 text-sm text-fg-2">
          {children}
        </div>
      )}
    </div>
  )
}

/** Score badge component */
function ScoreBadge({ score, label }: { score: number | string; label?: string }) {
  const num = typeof score === 'number' ? score : parseInt(String(score))
  const color = num >= 80 ? 'text-jade-light border-jade/40 bg-jade/10'
    : num >= 60 ? 'text-gold border-gold/40 bg-gold/10'
    : 'text-cinnabar-light border-cinnabar/40 bg-cinnabar/10'
  return (
    <span className={`px-2 py-0.5 rounded-sm text-xs border font-heading ${color}`}>
      {label ? `${label}: ` : ''}{score}
    </span>
  )
}

export default function DetailedAnalysis({ result }: Props) {
  const yhz = result.yuanHaiZiping
  const sq = yhz?.shenQiang
  const sd = yhz?.shidu
  const yy = (yhz as any)?.yinyang
  const yl = yhz?.yueLing
  const ts = yhz?.taiSui

  // Check if we have any data to show
  const hasYHZ = !!(yl?.summary || ts?.taiSui || (typeof sq === 'object' && sq.breakdown) || yy)
  const hasAnalysis = !!(result.analysis.SanMingTongHui?.length || result.analysis.rishi?.length)
  const hasSpouse = !!result.spouseAppearance
  const hasFamily = !!result.familyBackground
  const hasSelf = !!result.selfAppearance
  const hasEducation = !!result.educationAndTalent

  if (!hasYHZ && !hasAnalysis && !hasSpouse && !hasFamily && !hasSelf && !hasEducation) return null

  return (
    <div className="panel-traditional p-4">
      <h3 className="mb-3 border-b border-line-1 pb-2 font-heading text-xs tracking-wide-cn text-accent-gold">
        详细分析
      </h3>
      <div className="space-y-2">
        {/* 渊海子平详解 */}
        {hasYHZ && (
          <Accordion title="渊海子平详解" defaultOpen={true}>
            {/* Month command analysis */}
            {yl?.summary && (
              <div>
                <div className="text-xs text-gold/60 mb-1.5 font-heading">月令分析</div>
                <div className="space-y-1">
                  {['year', 'month', 'time'].map(k => {
                    const item = yl.summary[k]
                    if (!item) return null
                    const label = k === 'year' ? '年柱' : k === 'month' ? '月柱' : '时柱'
                    const gods = Array.isArray(item.gods) ? item.gods.flat().join('、') : '—'
                    return (
                      <div key={k} className="text-xs">
                        <span className="text-[var(--text-muted)]">{label}：</span>
                        <span className="text-parchment-100">{gods}</span>
                        {item.tags?.length > 0 && (
                          <span className="ml-1 text-gold">[{item.tags.join('、')}]</span>
                        )}
                        <span className="text-[var(--text-muted)] ml-1">— {item.note}</span>
                      </div>
                    )
                  })}
                </div>
                {yl.tips?.length > 0 && (
                  <div className="mt-2 text-xs text-[var(--text-muted)]">
                    {yl.tips.map((t: string, i: number) => <div key={i}>• {t}</div>)}
                  </div>
                )}
                {yl.yongShenSupport && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="text-[var(--text-muted)]">用神得力：</span>
                    {Object.entries(yl.yongShenSupport)
                      .filter(([k]) => k !== 'matched')
                      .map(([k, v]) => (
                        <span key={k}>{k} <span className={v === '得力' ? 'text-jade-light' : 'text-cinnabar-light'}>{String(v)}</span></span>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Tai Sui */}
            {ts?.taiSui && (
              <div className="border-t border-bronze/10 pt-2 mt-2">
                <div className="text-xs text-gold/60 mb-1.5 font-heading">太岁分析</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span>太岁：<span className="font-ganzhi text-parchment-100">{ts.taiSui.gan}{ts.taiSui.zhi}</span></span>
                  <span>关系：<span className={ts.relation?.includes('克') ? 'text-cinnabar-light' : 'text-jade-light'}>{ts.relation || '—'}</span></span>
                  <span>风险：<ScoreBadge score={ts.riskLevel === '高' ? 30 : ts.riskLevel === '中' ? 60 : 90} label={ts.riskLevel} /></span>
                </div>
                {ts.details?.length > 0 && (
                  <div className="mt-1 text-xs text-[var(--text-muted)]">
                    {ts.details.map((d: string, i: number) => <div key={i}>• {d}</div>)}
                  </div>
                )}
              </div>
            )}

            {/* Body strength breakdown */}
            {typeof sq === 'object' && sq.breakdown?.ganScores && (
              <div className="border-t border-bronze/10 pt-2 mt-2">
                <div className="text-xs text-gold/60 mb-1.5 font-heading">身强弱分解</div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <ScoreBadge score={sq.score} label={sq.judge} />
                  <span className="text-xs text-[var(--text-muted)]">阈值：{sq.threshold}</span>
                  {sq.breakdown.supportStems && (
                    <span className="text-xs text-[var(--text-muted)]">比劫助身：{sq.breakdown.supportStems.join('、')}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(sq.breakdown.ganScores as Record<string, number>)
                    .filter(([k, v]) => (v as number) > 0 && !/^(stem|branch)/i.test(k))
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([k, v]) => (
                      <span key={k} className={`px-1.5 py-0.5 rounded-sm text-xs border ${
                        (v as number) >= 10 ? 'border-jade/40 bg-jade/10 text-jade-light'
                        : 'border-bronze/30 bg-bronze/10 text-[var(--text-secondary)]'
                      }`}>
                        {k}:{String(v)}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Yin-Yang */}
            {yy && typeof yy === 'object' && (
              <div className="border-t border-bronze/10 pt-2 mt-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gold/60 font-heading">阴阳：</span>
                  <ScoreBadge score={yy.score} label={yy.judge} />
                  <span className="text-[var(--text-muted)]">正常范围：{Array.isArray(yy.normalRange) ? yy.normalRange.join(' ~ ') : '—'}</span>
                </div>
              </div>
            )}

            {/* Cold/Warm breakdown */}
            {typeof sd === 'object' && sd.breakdown?.parts && (
              <div className="border-t border-bronze/10 pt-2 mt-2">
                <div className="flex items-center gap-2 mb-1 text-xs">
                  <span className="text-gold/60 font-heading">寒暖燥湿：</span>
                  <ScoreBadge score={sd.score} label={sd.judge} />
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {Object.entries(sd.breakdown.parts as Record<string, number>)
                    .filter(([k]) => !/^(stem|branch)/i.test(k))
                    .map(([k, v]) => (
                    <span key={k} className={`px-1.5 py-0.5 rounded-sm border ${
                      (v as number) > 0 ? 'border-cinnabar/30 bg-cinnabar/10 text-cinnabar-light'
                      : 'border-wx-water/30 bg-wx-water/10 text-accent-azure'
                    }`}>
                      {k}:{String(v)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Accordion>
        )}

        {/* 三命通会 & 日时断语 */}
        {hasAnalysis && (
          <Accordion title="经典断语" defaultOpen={false}>
            {result.analysis.SanMingTongHui?.length > 0 && (
              <div>
                <div className="text-xs text-gold/60 mb-1.5 font-heading">三命通会</div>
                <div className="space-y-1.5">
                  {result.analysis.SanMingTongHui.filter((s: string) => s?.trim()).map((s: string, i: number) => {
                    // Extract [tag] prefix
                    const match = s.match(/^【(.+?)】(.*)/)
                    if (match) {
                      return (
                        <div key={i} className="text-xs">
                          <span className="text-gold/80 font-heading">【{match[1]}】</span>
                          <span className="text-[var(--text-secondary)]">{match[2]}</span>
                        </div>
                      )
                    }
                    return <div key={i} className="text-xs text-[var(--text-secondary)]">{s}</div>
                  })}
                </div>
              </div>
            )}
            {result.analysis.rishi?.length > 0 && (
              <div className={result.analysis.SanMingTongHui?.length ? 'border-t border-bronze/10 pt-2 mt-2' : ''}>
                <div className="text-xs text-gold/60 mb-1.5 font-heading">日时断语</div>
                <div className="space-y-1">
                  {result.analysis.rishi.filter((s: string) => s?.trim()).map((s: string, i: number) => (
                    <div key={i} className="text-xs text-[var(--text-secondary)]">• {s}</div>
                  ))}
                </div>
              </div>
            )}
          </Accordion>
        )}

        {/* 配偶信息 */}
        {hasSpouse && (
          <Accordion title="配偶信息" defaultOpen={false}>
            <div className="flex items-center gap-2 mb-2">
              <ScoreBadge score={result.spouseAppearance.score} />
              <span className="text-xs text-fg-1">{result.spouseAppearance.description}</span>
            </div>
            {result.spouseAppearance.details?.length > 0 && (
              <div className="space-y-1">
                {result.spouseAppearance.details.map((d: string, i: number) => (
                  <div key={i} className="text-xs text-[var(--text-muted)]">• {d}</div>
                ))}
              </div>
            )}
          </Accordion>
        )}

        {/* 家庭背景 */}
        {hasFamily && (
          <Accordion title="家庭背景" defaultOpen={false}>
            <div className="flex items-center gap-2 mb-2">
              <ScoreBadge score={result.familyBackground.score} />
              <span className="text-xs text-fg-1">{result.familyBackground.description}</span>
            </div>
            {result.familyBackground.details?.length > 0 && (
              <div className="space-y-1">
                {result.familyBackground.details.map((d: string, i: number) => (
                  <div key={i} className="text-xs text-[var(--text-muted)]">• {d}</div>
                ))}
              </div>
            )}
          </Accordion>
        )}

        {/* 个人特质 */}
        {hasSelf && (
          <Accordion title="个人特质" defaultOpen={false}>
            <div className="flex items-center gap-2 mb-2">
              <ScoreBadge score={result.selfAppearance.appearanceScore} label="外貌" />
              {result.selfAppearance.attractivenessOpposite && (
                <ScoreBadge score={result.selfAppearance.attractivenessOpposite.score} label="异性缘" />
              )}
            </div>
            {result.selfAppearance.description && (
              <div className="mb-1 text-xs text-fg-1">{result.selfAppearance.description}</div>
            )}
            {result.selfAppearance.characteristics?.length > 0 && (
              <div className="space-y-1">
                {result.selfAppearance.characteristics.map((c: string, i: number) => (
                  <div key={i} className="text-xs text-[var(--text-muted)]">• {c}</div>
                ))}
              </div>
            )}
          </Accordion>
        )}

        {/* 学历天赋 */}
        {hasEducation && (
          <Accordion title="学历与天赋" defaultOpen={false}>
            <div className="flex items-center gap-2 mb-2">
              <ScoreBadge score={result.educationAndTalent.educationScore} label={result.educationAndTalent.educationLevel} />
              <ScoreBadge score={result.educationAndTalent.talentScore} label={result.educationAndTalent.talentLevel} />
            </div>
            {result.educationAndTalent.description && (
              <div className="mb-1 text-xs text-fg-1">{result.educationAndTalent.description}</div>
            )}
            {result.educationAndTalent.details?.length > 0 && (
              <div className="space-y-1">
                {result.educationAndTalent.details.map((d: string, i: number) => (
                  <div key={i} className="text-xs text-[var(--text-muted)]">• {d}</div>
                ))}
              </div>
            )}
          </Accordion>
        )}
      </div>
    </div>
  )
}
