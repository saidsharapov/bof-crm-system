import { ArrowLeft } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  back?: boolean
  right?: ReactNode
}

export function PageHeader({ title, back = false, right }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <header style={{
      position:            'sticky',
      top:                 0,
      zIndex:              40,
      height:              56,
      display:             'flex',
      alignItems:          'center',
      padding:             '0 16px',
      gap:                 12,
      background:          'color-mix(in srgb, var(--surface-card) 88%, transparent)',
      backdropFilter:      'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom:        '1px solid var(--border-subtle)',
    }}>
      {back && (
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: 'var(--radius-lg)',
            border: 'none', background: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', marginLeft: -6,
            transition: 'background var(--dur-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          aria-label="Назад"
        >
          <ArrowLeft size={20} weight="bold" />
        </button>
      )}
      <h1 style={{
        flex: 1,
        fontSize: 'var(--text-lg)',
        fontWeight: 600,
        letterSpacing: 'var(--tracking-tight)',
        color: 'var(--text-primary)',
        margin: 0,
      }}>
        {title}
      </h1>
      {right && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>}
    </header>
  )
}
