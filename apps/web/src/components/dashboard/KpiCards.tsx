import { memo } from 'react'
import { ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { KPI_METRICS, type KpiMetric } from '@/mock/dashboard'
import type { UserRole } from '@/store/authStore'

// ── Tiny SVG sparkline ────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: KpiMetric['color'] }) {
  const W = 64
  const H = 24
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const xs = data.map((_, i) => (i / (data.length - 1)) * W)
  const ys = data.map((v)    => H - ((v - min) / range) * H * 0.85 - H * 0.075)

  const polyPts = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const lastX   = xs[xs.length - 1].toFixed(1)
  const lastY   = ys[ys.length - 1].toFixed(1)
  const areaPath = `M 0,${ys[0].toFixed(1)} ` +
    xs.slice(1).map((x, i) => `L ${x.toFixed(1)},${ys[i + 1].toFixed(1)}`).join(' ') +
    ` L ${lastX},${H} L 0,${H} Z`

  const STROKE: Record<KpiMetric['color'], string> = {
    brand: '#5b6ef5', emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e',
  }
  const FILL: Record<KpiMetric['color'], string> = {
    brand: 'rgba(91,110,245,0.18)', emerald: 'rgba(16,185,129,0.18)',
    amber: 'rgba(245,158,11,0.18)', rose: 'rgba(244,63,94,0.18)',
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden="true">
      <path d={areaPath} fill={FILL[color]} />
      <polyline points={polyPts} stroke={STROKE[color]} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={STROKE[color]} />
    </svg>
  )
}

// ── Single card ───────────────────────────────────────────────────────────────
const ACCENT_COLOR: Record<KpiMetric['color'], string> = {
  brand: '#5b6ef5', emerald: 'var(--success-fg)', amber: 'var(--warning-fg)', rose: 'var(--danger-fg)',
}

function KpiCard({ metric, delay }: { metric: KpiMetric; delay: string }) {
  const pos = metric.delta >= 0
  const accentColor = ACCENT_COLOR[metric.color]

  return (
    <div
      className="m-card animate-fade-up opacity-0 [animation-fill-mode:forwards]"
      style={{
        padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
        width: 176, flexShrink: 0, cursor: 'default',
        animationDelay: delay, borderRadius: 'var(--radius-2xl)',
        transition: 'box-shadow var(--dur-fast)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: accentColor, lineHeight: 1.2, margin: 0 }}>
          {metric.label}
        </p>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 600, flexShrink: 0, marginTop: 1,
          color: pos ? 'var(--success-fg)' : 'var(--danger-fg)',
        }}>
          {pos ? <ArrowUp size={10} weight="bold" /> : <ArrowDown size={10} weight="bold" />}
          {Math.abs(metric.delta)}%
        </span>
      </div>

      <div>
        <p style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
          {metric.value}
        </p>
        {metric.subValue && (
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4, marginBottom: 0 }}>{metric.subValue}</p>
        )}
      </div>

      <Sparkline data={metric.trend} color={metric.color} />
    </div>
  )
}

// ── Exported strip ────────────────────────────────────────────────────────────
export const KpiCards = memo(function KpiCards({ role }: { role: UserRole }) {
  const visible = KPI_METRICS.filter((m) => m.roles.includes(role))
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, margin: '0 -16px', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
      {visible.map((m, i) => (
        <KpiCard key={m.id} metric={m} delay={`${0.06 + i * 0.07}s`} />
      ))}
    </div>
  )
})
