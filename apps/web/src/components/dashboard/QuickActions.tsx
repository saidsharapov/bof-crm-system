import { memo } from 'react'
import {
  Plus, Package, Scissors, Columns, ChartBar, Users,
} from '@phosphor-icons/react'
import type { UserRole } from '@/store/authStore'

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  background: string
  color: string
  roles: UserRole[]
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'new-order',   label: 'Новый заказ',  icon: Plus,     background: 'var(--accent)',         color: 'var(--text-on-accent)', roles: ['ADMIN', 'MANAGER']   },
  { id: 'new-receipt', label: 'Приход сырья', icon: Package,  background: 'var(--success-solid)', color: '#fff', roles: ['ADMIN', 'WAREHOUSE'] },
  { id: 'new-produce', label: 'Задание цеху', icon: Scissors, background: 'var(--warning-solid)', color: '#fff', roles: ['ADMIN', 'WAREHOUSE'] },
  { id: 'kanban',      label: 'Канбан',        icon: Columns,  background: '#7c3aed',              color: '#fff', roles: ['ADMIN', 'MANAGER']   },
  { id: 'reports',     label: 'Отчёты',        icon: ChartBar, background: 'var(--danger-solid)',  color: '#fff', roles: ['ADMIN']              },
  { id: 'clients',     label: 'Клиенты',       icon: Users,    background: '#0284c7',              color: '#fff', roles: ['ADMIN', 'MANAGER']   },
]

export const QuickActions = memo(function QuickActions({ role }: { role: UserRole }) {
  const visible = QUICK_ACTIONS.filter((a) => a.roles.includes(role))

  return (
    <div
      className="animate-fade-up opacity-0 [animation-fill-mode:forwards]"
      style={{ animationDelay: '0.14s' }}
    >
      <p className="m-label" style={{ marginBottom: 12 }}>Быстрые действия</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {visible.map((action, i) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              className="animate-fade-up opacity-0 [animation-fill-mode:forwards]"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 'var(--radius-xl)',
                border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                background: action.background, color: action.color,
                animationDelay: `${0.15 + i * 0.04}s`,
                transition: 'opacity var(--dur-fast), transform var(--dur-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Icon size={14} weight="bold" />
              {action.label}
            </button>
          )
        })}
      </div>
    </div>
  )
})
