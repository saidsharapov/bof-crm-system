import { Navigate, Outlet, useLocation, NavLink } from 'react-router-dom'
import {
  House, Package, Storefront, Factory, ClipboardText, Gear,
  SignOut, Sun, Moon, Bell, MagnifyingGlass, ArrowSquareIn, ArrowSquareOut,
} from '@phosphor-icons/react'
import { useAuthStore, type UserRole } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/dashboard',  label: 'Главная',      icon: House,         roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] as UserRole[] },
  { path: '/products',   label: 'Товары',       icon: Package,       roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] as UserRole[] },
  { path: '/warehouse',  label: 'Склад',        icon: Storefront,    roles: ['ADMIN', 'WAREHOUSE'] as UserRole[], matchPrefix: true },
  { path: '/production', label: 'Производство', icon: Factory,       roles: ['ADMIN', 'WAREHOUSE'] as UserRole[] },
  { path: '/orders',     label: 'Заказы',       icon: ClipboardText, roles: ['ADMIN', 'MANAGER'] as UserRole[] },
]

const SYSTEM_ITEMS = [
  { path: '/settings', label: 'Настройки', icon: Gear, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] as UserRole[] },
]

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN:     'Администратор',
  MANAGER:   'Менеджер',
  WAREHOUSE: 'Кладовщик',
}

// ── Page titles ───────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':          'Главная',
  '/products':           'Товары',
  '/warehouse':          'Склад',
  '/warehouse/receipt':  'Приход товара',
  '/warehouse/expense':  'Расход товара',
  '/production':         'Производство',
  '/orders':             'Заказы',
  '/settings':           'Настройки',
}

// ── NavItem ───────────────────────────────────────────────────────────────────
function NavItem({
  path,
  label,
  Icon,
  isActive,
  isChild = false,
}: {
  path: string
  label: string
  Icon: React.ElementType
  isActive: boolean
  isChild?: boolean
}) {
  return (
    <NavLink
      to={path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        width: '100%',
        height: isChild ? 34 : 38,
        padding: isChild ? '0 11px 0 38px' : '0 11px',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        textAlign: 'left',
        textDecoration: 'none',
        position: 'relative',
        fontFamily: 'var(--font-sans)',
        fontSize: isChild ? 'var(--text-sm)' : 'var(--text-base)',
        fontWeight: isActive ? 600 : 500,
        background: isActive ? 'var(--surface-card)' : 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        boxShadow: isActive ? 'var(--shadow-xs)' : 'none',
        transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast)',
      }}
      className="bof-nav-item"
    >
      {isActive && (
        <span style={{
          position: 'absolute',
          left: -9,
          top: 8,
          bottom: 8,
          width: 3,
          borderRadius: 3,
          background: 'var(--accent)',
        }} />
      )}
      <Icon
        size={isChild ? 16 : 18}
        weight="duotone"
        style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)', flexShrink: 0 }}
      />
      <span style={{ flex: 1 }}>{label}</span>
    </NavLink>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ role, user }: { role: UserRole; user: { name: string; login: string; role: UserRole } }) {
  const location = useLocation()
  const { logout } = useAuthStore()
  const { theme, toggle } = useThemeStore()

  const isOnWarehouse = location.pathname.startsWith('/warehouse')

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const filteredNav    = NAV_ITEMS.filter((item) => item.roles.includes(role))
  const filteredSystem = SYSTEM_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <>
      <style>{`
        .bof-nav-item:hover:not([data-active]) {
          background: var(--surface-hover) !important;
          color: var(--text-primary) !important;
        }
        .bof-nav-item:hover:not([data-active]) svg {
          color: var(--text-primary) !important;
        }
        .bof-nav-btn:hover {
          background: var(--surface-hover) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
      <div style={{
        width: 'var(--sidebar-w)',
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-subtle)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '14px 12px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', marginBottom: 18 }}>
          <span style={{
            width: 34, height: 34,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: 'var(--shadow-xs)',
          }}>
            <span style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--bof-yellow-ink)',
              letterSpacing: '-0.04em',
            }}>BOF</span>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.15, letterSpacing: '-0.01em' }}>BOF CRM</span>
            <span style={{ display: 'block', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>Текстильное производство</span>
          </span>
        </div>

        {/* Main nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredNav.map((item) => {
            const Icon = item.icon
            const isActive = item.matchPrefix
              ? location.pathname.startsWith(item.path)
              : location.pathname === item.path

            return (
              <div key={item.path}>
                <NavItem path={item.path} label={item.label} Icon={Icon} isActive={isActive} />
                {item.path === '/warehouse' && isOnWarehouse && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '2px 0' }}>
                    <NavItem
                      path="/warehouse/receipt"
                      label="Приход"
                      Icon={ArrowSquareIn}
                      isActive={location.pathname === '/warehouse/receipt'}
                      isChild
                    />
                    <NavItem
                      path="/warehouse/expense"
                      label="Расход"
                      Icon={ArrowSquareOut}
                      isActive={location.pathname === '/warehouse/expense'}
                      isChild
                    />
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* System section */}
        <div style={{ marginTop: 22, marginBottom: 8, padding: '0 11px', fontSize: 'var(--text-2xs)', fontWeight: 600, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
          Система
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredSystem.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <NavItem key={item.path} path={item.path} label={item.label} Icon={Icon} isActive={isActive} />
            )
          })}
        </div>

        {/* Bottom */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="bof-nav-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              width: '100%', height: 36, padding: '0 11px',
              border: 'none', borderRadius: 'var(--radius-lg)',
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 500,
              transition: 'background var(--dur-fast)',
            }}
          >
            {theme === 'dark'
              ? <Sun size={17} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
              : <Moon size={17} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
            }
            <span style={{ flex: 1 }}>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="bof-nav-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              width: '100%', height: 36, padding: '0 11px',
              border: 'none', borderRadius: 'var(--radius-lg)',
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
              color: 'var(--danger-fg)',
              fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 500,
              transition: 'background var(--dur-fast)',
            }}
          >
            <SignOut size={17} weight="duotone" style={{ color: 'var(--danger-fg)' }} />
            Выйти
          </button>

          {/* User card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: 8,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--action-primary-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--action-primary-fg)',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</span>
              <span style={{ display: 'block', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>{ROLE_LABELS[user.role]}</span>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

// ── TopBar ────────────────────────────────────────────────────────────────────
function TopBar() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'BOF CRM'

  return (
    <header style={{
      height: 'var(--header-h)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 24px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'color-mix(in srgb, var(--surface-card) 80%, transparent)',
      backdropFilter: 'blur(var(--blur-md))',
      WebkitBackdropFilter: 'blur(var(--blur-md))',
      position: 'sticky',
      top: 0,
      zIndex: 20,
    }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{
          margin: 0,
          fontSize: 'var(--text-xl)',
          fontWeight: 600,
          letterSpacing: 'var(--tracking-tight)',
          color: 'var(--text-primary)',
          lineHeight: 1.1,
        }}>{title}</h1>
      </div>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 420, marginLeft: 8 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <MagnifyingGlass
            size={16}
            style={{ position: 'absolute', left: 12, color: 'var(--text-tertiary)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Поиск заказов, товаров, клиентов…"
            style={{
              width: '100%', height: 38,
              padding: '0 12px 0 36px',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              outline: 'none',
            }}
          />
          <kbd style={{
            position: 'absolute', right: 10,
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-tertiary)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 4, padding: '1px 5px',
          }}>&#8984;K</kbd>
        </div>
      </div>

      {/* Bell */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <button style={{
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            transition: 'background var(--dur-fast)',
          }}>
            <Bell size={18} weight="duotone" />
          </button>
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--danger-solid)',
            border: '2px solid var(--surface-card)',
          }} />
        </span>
      </div>
    </header>
  )
}

// ── DesktopLayout ─────────────────────────────────────────────────────────────
export function DesktopLayout() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-canvas)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
    }}>
      <Sidebar role={user.role} user={user} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: 24,
          background: 'var(--bg-canvas)',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
