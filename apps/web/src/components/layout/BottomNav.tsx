import { memo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  House, Package, Storefront, ClipboardText, Factory, Gear,
} from '@phosphor-icons/react'
import type { UserRole } from '@/store/authStore'

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
  roles: UserRole[]
  matchPrefix?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',  label: 'Главная',   icon: House,         roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { path: '/products',   label: 'Товары',    icon: Package,       roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { path: '/warehouse',  label: 'Склад',     icon: Storefront,    roles: ['ADMIN', 'WAREHOUSE'],            matchPrefix: true },
  { path: '/production', label: 'Произв.',   icon: Factory,       roles: ['ADMIN', 'WAREHOUSE'] },
  { path: '/orders',     label: 'Заказы',    icon: ClipboardText, roles: ['ADMIN', 'MANAGER'] },
  { path: '/settings',   label: 'Настройки', icon: Gear,          roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
]

export const BottomNav = memo(function BottomNav({ role }: { role: UserRole }) {
  const location = useLocation()
  const visible  = NAV_ITEMS.filter((n) => n.roles.includes(role))

  return (
    <>
      <style>{`
        .bof-tab:hover { background: var(--surface-hover) !important; }
        .bof-tab:active { transform: scale(0.9); }
      `}</style>

      <nav
        style={{
          position:            'fixed',
          bottom:              0,
          left:                0,
          right:               0,
          zIndex:              50,
          background:          'color-mix(in srgb, var(--surface-card) 92%, transparent)',
          backdropFilter:      'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop:           '1px solid var(--border-subtle)',
          boxShadow:           '0 -1px 0 var(--border-subtle)',
        }}
      >
        <div
          style={{
            display:        'flex',
            alignItems:     'flex-end',
            justifyContent: 'space-around',
            padding:        '6px 4px',
            paddingBottom:  'calc(6px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {visible.map((item) => {
            const isActive = item.matchPrefix
              ? location.pathname.startsWith(item.path)
              : location.pathname === item.path
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="bof-tab"
                style={{
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  gap:            2,
                  minWidth:       44,
                  padding:        '6px 8px',
                  borderRadius:   'var(--radius-lg)',
                  textDecoration: 'none',
                  transition:     'all 150ms ease',
                  userSelect:     'none',
                  WebkitUserSelect: 'none',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Icon
                    size={22}
                    weight={isActive ? 'fill' : 'regular'}
                    style={{
                      color:      isActive ? '#5b6ef5' : 'var(--text-tertiary)',
                      transition: 'color 150ms',
                    }}
                  />
                  {isActive && (
                    <span style={{
                      position:        'absolute',
                      bottom:          -2,
                      left:            '50%',
                      transform:       'translateX(-50%)',
                      width:           4,
                      height:          4,
                      borderRadius:    '50%',
                      background:      '#5b6ef5',
                    }} />
                  )}
                </div>
                <span style={{
                  fontSize:   9,
                  fontWeight: isActive ? 600 : 400,
                  color:      isActive ? '#5b6ef5' : 'var(--text-tertiary)',
                  lineHeight: 1.2,
                  textAlign:  'center',
                  transition: 'color 150ms',
                }}>
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
})
