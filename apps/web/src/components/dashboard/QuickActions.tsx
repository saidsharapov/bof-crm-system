import { memo } from 'react'
import {
  Plus, Package, Scissors, Columns, ChartBar, Users,
} from '@phosphor-icons/react'
import { QUICK_ACTIONS } from '@/mock/dashboard'
import type { UserRole } from '@/store/authStore'

const ICON_MAP: Record<string, React.ElementType> = {
  Plus, Package, Scissors, Columns, ChartBar, Users,
}

// Map Tailwind color classes to CSS-var-based inline styles
const ACTION_STYLES: Record<string, { background: string; color: string }> = {
  'bg-brand-600':   { background: '#5b6ef5',            color: '#fff' },
  'bg-emerald-600': { background: 'var(--success-solid)', color: '#fff' },
  'bg-amber-600':   { background: 'var(--warning-solid)', color: '#fff' },
  'bg-rose-600':    { background: 'var(--danger-solid)',  color: '#fff' },
  'bg-purple-600':  { background: '#7c3aed',              color: '#fff' },
}

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
          const Icon = ICON_MAP[action.icon] ?? Plus
          // Extract the base color class from action.color string
          const colorKey = action.color.split(' ').find((c) => c.startsWith('bg-')) ?? 'bg-brand-600'
          const btnStyle = ACTION_STYLES[colorKey] ?? { background: '#5b6ef5', color: '#fff' }
          return (
            <button
              key={action.id}
              className="animate-fade-up opacity-0 [animation-fill-mode:forwards]"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 'var(--radius-xl)',
                border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                ...btnStyle,
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
