import { ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { useAuthStore } from '@/store/authStore'
import { KPI_METRICS, type KpiMetric } from '@/mock/dashboard'
import { WeeklyChart }      from '@/components/dashboard/WeeklyChart'
import { RecentMovements }  from '@/components/dashboard/RecentMovements'
import { ActiveOrders }     from '@/components/dashboard/ActiveOrders'
import { QuickActions }     from '@/components/dashboard/QuickActions'

// ── Greeting ──────────────────────────────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'Доброе утро'
  if (h >= 12 && h < 17) return 'Добрый день'
  if (h >= 17 && h < 22) return 'Добрый вечер'
  return 'Доброй ночи'
}

// ── KpiCardDesktop ────────────────────────────────────────────────────────────
function KpiCardDesktop({ metric }: { metric: KpiMetric }) {
  const isPositive = metric.delta >= 0
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-2xl)',
      boxShadow: 'var(--shadow-sm)',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      cursor: 'default',
      transition: 'transform 200ms, box-shadow 200ms',
    }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.01)' }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)' }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 'var(--text-2xs)',
          fontWeight: 600,
          letterSpacing: 'var(--tracking-caps)',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}>
          {metric.label}
        </span>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 2,
          fontSize: 11, fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 6,
          border: '1px solid',
          color: isPositive ? 'var(--success-fg)' : 'var(--danger-fg)',
          background: isPositive ? 'var(--success-bg)' : 'var(--danger-bg)',
          borderColor: isPositive ? 'var(--success-border)' : 'var(--danger-border)',
        }}>
          {isPositive
            ? <ArrowUp size={10} weight="bold" />
            : <ArrowDown size={10} weight="bold" />
          }
          {Math.abs(metric.delta)}%
        </span>
      </div>

      {/* Value */}
      <div>
        <p style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 700,
          letterSpacing: 'var(--tracking-tight)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          margin: 0,
        }}>{metric.value}</p>
        {metric.subValue && (
          <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', marginTop: 4, margin: '4px 0 0' }}>
            {metric.subValue}
          </p>
        )}
      </div>
    </div>
  )
}

// ── DashboardDesktop ──────────────────────────────────────────────────────────
export function DashboardDesktop() {
  const { user } = useAuthStore()
  if (!user) return null

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const kpis = KPI_METRICS.filter((m) => m.roles.includes(user.role))

  const SHOW_WAREHOUSE = user.role === 'ADMIN' || user.role === 'WAREHOUSE'
  const SHOW_ORDERS    = user.role === 'ADMIN' || user.role === 'MANAGER'
  const SHOW_CHART     = user.role === 'ADMIN' || user.role === 'MANAGER'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>
      {/* Welcome */}
      <div className="animate-fade-up opacity-0 [animation-fill-mode:forwards]">
        <p style={{ fontSize: 'var(--text-2xs)', fontWeight: 600, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: 0 }}>{today}</p>
        <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)', marginTop: 4, margin: '4px 0 0' }}>
          {greeting()}, {user.name.split(' ')[0]}
        </h2>
      </div>

      {/* KPI grid */}
      {kpis.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {kpis.map((m) => (
            <KpiCardDesktop key={m.id} metric={m} />
          ))}
        </div>
      )}

      {/* Chart + movements */}
      {(SHOW_CHART || SHOW_WAREHOUSE) && (
        <div
          style={{
            display: 'grid',
            gap: 20,
            gridTemplateColumns: SHOW_CHART && SHOW_WAREHOUSE ? '1fr 1fr 1fr' : '1fr',
          }}
        >
          {SHOW_CHART && (
            <div style={{ gridColumn: SHOW_WAREHOUSE ? 'span 2' : 'span 3' }}>
              <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <WeeklyChart />
              </div>
            </div>
          )}
          {SHOW_WAREHOUSE && (
            <div>
              <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <RecentMovements />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders */}
      {SHOW_ORDERS && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <ActiveOrders />
        </div>
      )}

      {/* Quick actions */}
      <QuickActions role={user.role} />
    </div>
  )
}
