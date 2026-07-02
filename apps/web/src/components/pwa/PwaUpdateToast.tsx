import { useRegisterSW } from 'virtual:pwa-register/react'
import { ArrowClockwise, X } from '@phosphor-icons/react'

/**
 * Minimal toast shown when a new SW version is available.
 * On mobile it appears at the bottom; on desktop at the bottom-right.
 * The user can tap "Обновить" to reload, or dismiss.
 */
export function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Poll for updates every hour when the tab is open
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000)
      }
    },
  })

  if (!needRefresh) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position:     'fixed',
        bottom:       'calc(env(safe-area-inset-bottom, 0px) + 80px)',
        left:         '50%',
        transform:    'translateX(-50%)',
        zIndex:       9999,
        display:      'flex',
        alignItems:   'center',
        gap:          12,
        padding:      '12px 16px',
        borderRadius: 16,
        background:   'rgba(15,15,26,0.95)',
        border:       '1px solid rgba(255,237,0,0.25)',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        minWidth:     240,
        maxWidth:     'calc(100vw - 32px)',
        color:        '#fff',
        fontSize:     13,
        fontFamily:   'inherit',
        whiteSpace:   'nowrap',
      }}
    >
      <ArrowClockwise size={16} weight="bold" style={{ color: 'var(--accent)', flexShrink: 0 }} />

      <span style={{ flex: 1, color: 'rgba(255,255,255,0.75)' }}>
        Доступно обновление
      </span>

      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          padding:      '5px 12px',
          borderRadius: 8,
          background:   'var(--accent)',
          border:       'none',
          color:        'var(--text-on-accent)',
          fontSize:     12,
          fontWeight:   600,
          cursor:       'pointer',
          flexShrink:   0,
        }}
      >
        Обновить
      </button>

      <button
        onClick={() => setNeedRefresh(false)}
        style={{
          display:     'flex',
          alignItems:  'center',
          background:  'none',
          border:      'none',
          color:       'rgba(255,255,255,0.3)',
          cursor:      'pointer',
          padding:     4,
          borderRadius: 6,
          flexShrink:  0,
        }}
        aria-label="Закрыть"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  )
}
