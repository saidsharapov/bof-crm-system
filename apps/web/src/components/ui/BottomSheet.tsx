import { useEffect, useRef, type ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  tall?: boolean
}

export function BottomSheet({ open, onClose, title, children, tall = false }: BottomSheetProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) ref.current?.focus()
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position:       'fixed',
          inset:          0,
          zIndex:         50,
          background:     'var(--scrim)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity:        open ? 1 : 0,
          pointerEvents:  open ? 'auto' : 'none',
          transition:     'opacity 200ms',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        style={{
          position:      'fixed',
          bottom:        0,
          left:          0,
          right:         0,
          zIndex:        51,
          outline:       'none',
          background:    'var(--surface-overlay)',
          border:        'none',
          borderTop:     '1px solid var(--border-subtle)',
          borderRadius:  '24px 24px 0 0',
          boxShadow:     'var(--shadow-xl)',
          transform:     open ? 'translateY(0)' : 'translateY(100%)',
          transition:    'transform 300ms cubic-bezier(0.32,0.72,0,1)',
          maxHeight:     tall ? '95dvh' : '90dvh',
          display:       'flex',
          flexDirection: 'column',
        }}
      >
        {/* Handle */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 16px 8px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
          {title && (
            <p style={{
              fontSize: 'var(--text-md)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '12px 0 4px',
            }}>{title}</p>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {children}
        </div>
      </div>
    </>
  )
}
