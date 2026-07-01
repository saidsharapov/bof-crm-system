import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 12, padding: '64px 16px', textAlign: 'center',
    }}>
      <div style={{ color: 'var(--text-disabled)' }}>{icon}</div>
      <div>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)', margin: 0 }}>{title}</p>
        {subtitle && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}
