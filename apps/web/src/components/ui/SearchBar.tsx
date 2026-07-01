import { MagnifyingGlass, X } from '@phosphor-icons/react'

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ value, onChange, placeholder = 'Поиск…', className }: SearchBarProps) {
  return (
    <div
      className={className}
      style={{
        position:      'relative',
        display:       'flex',
        alignItems:    'center',
        borderRadius:  'var(--radius-xl)',
        border:        '1px solid var(--border-default)',
        background:    'var(--surface-sunken)',
        transition:    'border-color var(--dur-fast), box-shadow var(--dur-fast)',
      }}
      onFocusCapture={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-border)'
        e.currentTarget.style.boxShadow   = 'var(--ring-accent)'
      }}
      onBlurCapture={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)'
        e.currentTarget.style.boxShadow   = 'none'
      }}
    >
      <MagnifyingGlass
        size={16}
        style={{ position: 'absolute', left: 12, color: 'var(--text-tertiary)', pointerEvents: 'none' }}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width:       '100%',
          padding:     '10px 36px 10px 36px',
          background:  'transparent',
          border:      'none',
          outline:     'none',
          fontFamily:  'var(--font-sans)',
          fontSize:    'var(--text-sm)',
          color:       'var(--text-primary)',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute', right: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 4, border: 'none', background: 'none', cursor: 'pointer',
            color: 'var(--text-tertiary)',
          }}
          aria-label="Очистить"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
