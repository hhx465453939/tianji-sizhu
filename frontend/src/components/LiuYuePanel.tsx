interface Props {
  liuYue: {
    index?: number
    monthCn?: string
    ganZhi: string | string[]
    shiShen?: string
    zhiHideGanShiShen?: { gan: string; qiLevel: string; shiShen: string }[]
    ziZuo?: string
    xingYunZhi?: string
  } | null
  liuYueShensha?: string[]
}

export default function LiuYuePanel({ liuYue, liuYueShensha }: Props) {
  if (!liuYue) return null

  const ganZhi = Array.isArray(liuYue.ganZhi)
    ? liuYue.ganZhi.join('')
    : liuYue.ganZhi

  return (
    <div className="panel-traditional p-4">
      <h3 className="text-xs text-gold/70 mb-3 font-heading tracking-wide-cn">流月</h3>

      <div className="flex flex-wrap gap-4 mb-3">
        <div>
          <span className="text-xs text-[var(--text-muted)]">干支：</span>
          <span className="text-lg font-bold font-ganzhi text-parchment-100">{ganZhi}</span>
        </div>
        {liuYue.shiShen && (
          <div>
            <span className="text-xs text-[var(--text-muted)]">十神：</span>
            <span className="text-sm text-parchment-300">{liuYue.shiShen}</span>
          </div>
        )}
        {liuYue.ziZuo && (
          <div>
            <span className="text-xs text-[var(--text-muted)]">自坐：</span>
            <span className="text-sm text-parchment-300">{liuYue.ziZuo}</span>
          </div>
        )}
        {liuYue.xingYunZhi && (
          <div>
            <span className="text-xs text-[var(--text-muted)]">星运：</span>
            <span className="text-sm text-parchment-300">{liuYue.xingYunZhi}</span>
          </div>
        )}
      </div>

      {/* Hidden Gan details */}
      {liuYue.zhiHideGanShiShen && liuYue.zhiHideGanShiShen.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-[var(--text-muted)] mr-2">藏干：</span>
          <div className="inline-flex gap-2 flex-wrap">
            {liuYue.zhiHideGanShiShen.map((h, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-sm bg-ink-700 border border-bronze/20 text-parchment-300">
                {h.gan}({h.qiLevel}) · {h.shiShen}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* LiuYue Shensha */}
      {liuYueShensha && liuYueShensha.length > 0 && (
        <div className="border-t border-bronze/20 pt-2 mt-2">
          <span className="text-xs text-[var(--text-muted)] mr-2">月神煞：</span>
          <div className="inline-flex flex-wrap gap-1.5 mt-1">
            {liuYueShensha.map((s, i) => (
              <span key={i} className="px-2 py-0.5 rounded-sm text-xs border-2 border-jade/40 bg-jade/10 text-jade-light font-heading">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
