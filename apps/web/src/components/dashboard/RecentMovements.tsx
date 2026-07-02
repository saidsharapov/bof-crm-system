import { memo } from 'react'
import { ArrowDown, ArrowUp, Lock, Factory } from '@phosphor-icons/react'
import type { DashboardRecentMovement } from '@/api/dashboard'

type MovementType = 'IN' | 'OUT' | 'RESERVE' | 'PRODUCE'

const TYPE_META: Record<MovementType, { label: string; icon: React.ElementType; color: string }> = {
  IN:      { label: 'Приход',   icon: ArrowDown, color: 'var(--success-fg)' },
  OUT:     { label: 'Расход',   icon: ArrowUp,   color: 'var(--danger-fg)'  },
  RESERVE: { label: 'Резерв',   icon: Lock,      color: 'var(--warning-fg)' },
  PRODUCE: { label: 'Выпуск',   icon: Factory,   color: 'var(--info-fg)'    },
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} мин`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} ч`
  return `${Math.floor(hrs / 24)} д`
}

export const RecentMovements = memo(function RecentMovements({ movements }: { movements: DashboardRecentMovement[] }) {
  return (
    <div
      className="m-list animate-fade-up opacity-0 [animation-fill-mode:forwards]"
      style={{ animationDelay: '0.26s' }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
      }}>
        <p className="m-label">Движения склада</p>
        <button style={{
          fontSize: 10, color: 'var(--text-secondary)', background: 'none', border: 'none',
          cursor: 'pointer', fontWeight: 500,
        }}>
          Все →
        </button>
      </div>

      {/* List */}
      <ul className="divide-ds">
        {movements.map((mv, i) => {
          const mvType = (mv.type as MovementType) in TYPE_META ? (mv.type as MovementType) : 'OUT'
          const meta = TYPE_META[mvType]
          const Icon = meta.icon
          const name = mv.material?.name ?? mv.product?.name ?? '—'
          const unit = mv.material?.unit ?? 'шт'
          const sign = mv.qty >= 0 ? '+' : ''
          return (
            <li
              key={mv.id}
              className="animate-fade-up opacity-0 [animation-fill-mode:forwards]"
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                animationDelay: `${0.28 + i * 0.04}s`,
                transition: 'background var(--dur-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Icon badge */}
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--radius-lg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: 'var(--surface-sunken)',
              }}>
                <Icon size={14} weight="duotone" style={{ color: meta.color }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                  {name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0' }}>
                  {mv.comment ?? meta.label}
                </p>
              </div>

              {/* Right */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: meta.color, margin: 0 }}>
                  {sign}{mv.qty} {unit}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{formatTime(mv.createdAt)}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
})
