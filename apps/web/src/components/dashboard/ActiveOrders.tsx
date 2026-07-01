import { memo } from 'react'
import type { DashboardRecentOrder } from '@/api/dashboard'

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  NEW:       { label: 'Новый',     color: '#5b6ef5',              bg: 'rgba(91,110,245,0.1)',     border: 'rgba(91,110,245,0.25)',   dot: '#5b6ef5'                },
  IN_WORK:   { label: 'В работе',  color: 'var(--warning-fg)',    bg: 'var(--warning-bg)',         border: 'var(--warning-border)',   dot: 'var(--warning-fg)'      },
  DONE:      { label: 'Готов',     color: 'var(--success-fg)',    bg: 'var(--success-bg)',         border: 'var(--success-border)',   dot: 'var(--success-fg)'      },
  DELIVERED: { label: 'Выдан',     color: 'var(--success-fg)',    bg: 'var(--success-bg)',         border: 'var(--success-border)',   dot: 'var(--success-fg)'      },
  CANCELED:  { label: 'Отменён',   color: 'var(--text-tertiary)', bg: 'var(--surface-sunken)',     border: 'var(--border-subtle)',    dot: 'var(--text-disabled)'   },
}

const FALLBACK_META = STATUS_META['NEW']

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'сегодня'
  if (diffDays === 1) return 'вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export const ActiveOrders = memo(function ActiveOrders({ orders }: { orders: DashboardRecentOrder[] }) {
  return (
    <div
      className="m-list animate-fade-up opacity-0 [animation-fill-mode:forwards]"
      style={{ animationDelay: '0.34s' }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
      }}>
        <p className="m-label">Активные заказы</p>
        <button style={{
          fontSize: 10, color: '#5b6ef5', background: 'none', border: 'none',
          cursor: 'pointer', fontWeight: 500,
        }}>
          Все →
        </button>
      </div>

      {/* Order cards */}
      <ul className="divide-ds">
        {orders.map((order, i) => {
          const st = STATUS_META[order.status] ?? FALLBACK_META
          const itemsLabel = order.items ? `${order.items.reduce((s, it) => s + it.qty, 0)} шт.` : ''
          const totalLabel = order.totalAmount ? `${order.totalAmount.toLocaleString('ru-RU')} UZS` : ''
          return (
            <li
              key={order.id}
              className="animate-fade-up opacity-0 [animation-fill-mode:forwards]"
              style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', animationDelay: `${0.36 + i * 0.04}s`,
                transition: 'background var(--dur-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Status dot */}
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, flexShrink: 0 }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    {order.num}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.clientName}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, marginBottom: 0 }}>
                  {itemsLabel}{itemsLabel && ' · '}{formatDate(order.createdAt)}
                </p>
              </div>

              {/* Right side */}
              <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                {totalLabel && (
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                    {totalLabel}
                  </p>
                )}
                <span style={{
                  fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                  padding: '2px 6px', borderRadius: 6,
                  color: st.color, background: st.bg, border: `1px solid ${st.border}`,
                }}>
                  {st.label}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
})
