import { memo, useState } from 'react'
import clsx from 'clsx'
import { WEEKLY_DATA } from '@/mock/dashboard'
import { useThemeStore } from '@/store/themeStore'

type Metric = 'orders' | 'revenue'

// ── SVG bar + area chart ──────────────────────────────────────────────────────
function BarChart({ data, metric, isDark }: { data: typeof WEEKLY_DATA; metric: Metric; isDark: boolean }) {
  const W   = 300
  const H   = 100
  const PAD = { top: 8, bottom: 24, left: 4, right: 4 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const values = data.map((d) => d[metric])
  const max    = Math.max(...values)
  const barW   = innerW / data.length
  const today  = data.length - 1   // last bar = today

  // Area line points (mid-top of each bar)
  const linePts = data.map((d, i) => {
    const x = PAD.left + i * barW + barW / 2
    const y = PAD.top + innerH - (d[metric] / max) * innerH
    return { x, y, label: metric === 'revenue' ? `${(d[metric] / 1000).toFixed(0)}k` : String(d[metric]) }  // k = тысячи UZS
  })
  const polyline = linePts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = `M ${linePts[0].x.toFixed(1)},${linePts[0].y.toFixed(1)} ` +
    linePts.slice(1).map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
    ` L ${linePts[linePts.length - 1].x.toFixed(1)},${(PAD.top + innerH).toFixed(1)}` +
    ` L ${linePts[0].x.toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: H }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#5b6ef5" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#5b6ef5" stopOpacity="0"    />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((pct) => (
        <line
          key={pct}
          x1={PAD.left} y1={(PAD.top + innerH * (1 - pct)).toFixed(1)}
          x2={W - PAD.right} y2={(PAD.top + innerH * (1 - pct)).toFixed(1)}
          stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} strokeWidth="1"
        />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <polyline
        points={polyline}
        stroke="#5b6ef5"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Bars (subtle, behind line) */}
      {data.map((d, i) => {
        const bH = (d[metric] / max) * innerH
        const x  = PAD.left + i * barW + barW * 0.2
        const y  = PAD.top + innerH - bH
        const isToday = i === today
        return (
          <rect
            key={i}
            x={x.toFixed(1)} y={y.toFixed(1)}
            width={(barW * 0.6).toFixed(1)} height={bH.toFixed(1)}
            rx="3"
            fill={isToday ? 'rgba(91,110,245,0.35)' : 'rgba(91,110,245,0.12)'}
          />
        )
      })}

      {/* Today dot + value */}
      {(() => {
        const p = linePts[today]
        return (
          <>
            <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4" fill="#5b6ef5" />
            <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="7" fill="rgba(91,110,245,0.25)" />
            <text
              x={p.x.toFixed(1)} y={(p.y - 10).toFixed(1)}
              textAnchor="middle" fontSize="9" fill={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,15,26,0.6)'} fontWeight="600"
            >
              {p.label}
            </text>
          </>
        )
      })()}

      {/* Day labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={(PAD.left + i * barW + barW / 2).toFixed(1)}
          y={(H - 4).toFixed(1)}
          textAnchor="middle"
          fontSize="9"
          fill={i === today
            ? (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,15,26,0.6)')
            : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,15,26,0.25)')}
          fontWeight={i === today ? '600' : '400'}
        >
          {d.day}
        </text>
      ))}
    </svg>
  )
}

// ── Exported chart card ───────────────────────────────────────────────────────
export const WeeklyChart = memo(function WeeklyChart() {
  const [metric, setMetric] = useState<Metric>('orders')
  const isDark = useThemeStore((s) => s.theme === 'dark')

  const totals = {
    orders:  WEEKLY_DATA.reduce((s, d) => s + d.orders, 0),
    revenue: WEEKLY_DATA.reduce((s, d) => s + d.revenue, 0),
  }

  return (
    <div
      className="glass rounded-2xl p-4 animate-fade-up opacity-0 [animation-fill-mode:forwards]"
      style={{ animationDelay: '0.20s' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest">Динамика за неделю</p>
          <p className="text-lg font-semibold mt-0.5">
            {metric === 'orders'
              ? `${totals.orders} заказов`
              : `${totals.revenue.toLocaleString('ru-RU')} UZS`}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5 shrink-0">
          {(['orders', 'revenue'] as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={clsx(
                'px-2.5 py-1 rounded-md text-[10px] font-medium transition-all duration-150',
                metric === m
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-white/35 hover:text-white/60',
              )}
            >
              {m === 'orders' ? 'Заказы' : 'Выручка'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <BarChart data={WEEKLY_DATA} metric={metric} isDark={isDark} />
    </div>
  )
})
