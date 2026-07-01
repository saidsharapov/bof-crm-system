import { useState, useEffect } from 'react'
import { Bell, SignOut, Gear } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { dashboardApi, type DashboardData } from '@/api/dashboard'
import { buildKpiMetrics, KpiCards } from '@/components/dashboard/KpiCards'
import { QuickActions }    from '@/components/dashboard/QuickActions'
import { WeeklyChart }     from '@/components/dashboard/WeeklyChart'
import { RecentMovements } from '@/components/dashboard/RecentMovements'
import { ActiveOrders }    from '@/components/dashboard/ActiveOrders'

// ── Role labels ───────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  ADMIN:     'Администратор',
  MANAGER:   'Менеджер',
  WAREHOUSE: 'Кладовщик',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 6)  return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

function Avatar({ name }: { name: string }) {
  const parts    = name.split(' ')
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%',
      background: 'var(--action-primary-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--action-primary-fg)',
      fontSize: 12, fontWeight: 700, flexShrink: 0,
      cursor: 'pointer',
    }}>
      {initials}
    </div>
  )
}

// ── Quick settings sheet ──────────────────────────────────────────────────────
function SettingsSheet({
  open, onClose, onLogout,
}: { open: boolean; onClose: () => void; onLogout: () => void }) {
  return (
    <>
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'var(--scrim)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
        />
      )}
      <div style={{
        position:   'fixed',
        bottom:     0,
        left:       0,
        right:      0,
        zIndex:     51,
        background: 'var(--surface-overlay)',
        borderTop:  '1px solid var(--border-subtle)',
        borderRadius: '24px 24px 0 0',
        boxShadow:  'var(--shadow-xl)',
        transform:  open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 280ms cubic-bezier(0.32,0.72,0,1)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-default)', margin: '12px auto 20px' }} />
        <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p className="m-label" style={{ marginBottom: 12, paddingLeft: 4 }}>Настройки</p>

          {[
            { icon: Bell, label: 'Уведомления', sub: 'Настройка оповещений' },
            { icon: Gear, label: 'Профиль', sub: 'Данные аккаунта' },
          ].map(({ icon: Icon, label, sub }) => (
            <button key={label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 'var(--radius-xl)',
              border: 'none', background: 'none', cursor: 'pointer',
              textAlign: 'left', width: '100%', color: 'var(--text-primary)',
              transition: 'background var(--dur-fast)',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <Icon size={18} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{sub}</p>
              </div>
            </button>
          ))}

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 'var(--radius-xl)',
            border: 'none', background: 'none', cursor: 'pointer',
            textAlign: 'left', width: '100%',
            transition: 'background var(--dur-fast)',
          }}>
            <SignOut size={18} weight="duotone" style={{ color: 'var(--danger-fg)' }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--danger-fg)' }}>Выйти из аккаунта</span>
          </button>
        </div>
      </div>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    dashboardApi.getStats().then(setData).catch(() => {/* keep null */})
  }, [])

  if (!user) return null

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const SHOW_WAREHOUSE = user.role === 'ADMIN' || user.role === 'WAREHOUSE'
  const SHOW_ORDERS    = user.role === 'ADMIN' || user.role === 'MANAGER'
  const SHOW_CHART     = user.role === 'ADMIN' || user.role === 'MANAGER'

  return (
    <div style={{ minHeight: '100dvh' }}>
      {/* ── Sticky top bar ─────────────────────────────────────────────────── */}
      <header style={{
        position:            'sticky',
        top:                 0,
        zIndex:              40,
        height:              56,
        display:             'flex',
        alignItems:          'center',
        justifyContent:      'space-between',
        padding:             '0 16px',
        background:          'color-mix(in srgb, var(--surface-card) 88%, transparent)',
        backdropFilter:      'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom:        '1px solid var(--border-subtle)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 'var(--radius-md)',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'Georgia, serif', fontWeight: 700,
              fontSize: 11, color: 'var(--bof-yellow-ink)', letterSpacing: '-0.04em',
            }}>BOF</span>
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>BOF CRM</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button style={{
            position: 'relative', padding: 8, borderRadius: 'var(--radius-lg)',
            border: 'none', background: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)',
          }}>
            <Bell size={20} weight="duotone" />
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--danger-solid)',
              border: '2px solid var(--surface-card)',
            }} />
          </button>
          <button
            onClick={() => setSheetOpen(true)}
            style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <Avatar name={user.name} />
          </button>
        </div>
      </header>

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <main style={{ padding: '20px 16px', paddingBottom: 112, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Welcome */}
        <section className="animate-fade-up opacity-0 [animation-fill-mode:forwards]">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{today}</p>
              <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                {greeting()},<br />
                {user.name.split(' ')[0]}
              </h1>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', padding: '4px 10px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent-text)',
              whiteSpace: 'nowrap', marginTop: 4,
            }}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </section>

        {/* KPI */}
        {data && (
          <section>
            <p className="m-label" style={{ marginBottom: 12 }}>Показатели</p>
            <KpiCards role={user.role} metrics={buildKpiMetrics(data.kpi)} />
          </section>
        )}

        <QuickActions role={user.role} />
        {SHOW_CHART     && data && <WeeklyChart data={data.chart} />}
        {SHOW_WAREHOUSE && data && <RecentMovements movements={data.recentMovements} />}
        {SHOW_ORDERS    && data && <ActiveOrders orders={data.recentOrders} />}

      </main>

      <SettingsSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onLogout={handleLogout} />
    </div>
  )
}
