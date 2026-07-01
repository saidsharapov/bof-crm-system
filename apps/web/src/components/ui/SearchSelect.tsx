import { useState, useRef, useEffect } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'

export interface SearchSelectOption {
  value: string
  label: string
  subLabel?: string
  disabled?: boolean
}

interface SearchSelectProps {
  value: string
  onChange: (val: string) => void
  options: SearchSelectOption[]
  placeholder?: string
  style?: React.CSSProperties
  hasError?: boolean
  variant?: 'light' | 'dark'
}

export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = '— выберите —',
  style,
  hasError,
  variant = 'light',
}: SearchSelectProps) {
  const [open, setOpen]             = useState(false)
  const [query, setQuery]           = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const listRef      = useRef<HTMLDivElement>(null)
  const isLight      = variant === 'light'

  const selected = options.find((o) => o.value === value)

  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.subLabel ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : options

  // Reset highlight on filter change
  useEffect(() => { setHighlighted(0) }, [query])

  // Focus search input when opened; clear query on close
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 10)
      return () => clearTimeout(t)
    } else {
      setQuery('')
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.children[highlighted] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  function select(val: string) {
    onChange(val)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); if (filtered[highlighted]) select(filtered[highlighted].value) }
  }

  // ── Design tokens per variant ──
  const bg        = isLight ? 'var(--surface-card)' : 'rgba(255,255,255,0.04)'
  const border    = hasError
    ? (isLight ? 'var(--danger-border)' : 'rgba(239,68,68,0.5)')
    : (isLight ? 'var(--border-default)' : 'rgba(255,255,255,0.08)')
  const textMain  = isLight ? 'var(--text-primary)'  : 'rgba(255,255,255,0.85)'
  const textEmpty = isLight ? 'var(--text-disabled)' : 'rgba(255,255,255,0.25)'
  const dropBg    = isLight ? 'var(--surface-overlay)' : '#16161e'
  const dropBorder = isLight ? 'var(--border-default)' : 'rgba(255,255,255,0.1)'
  const searchBg  = isLight ? 'var(--surface-sunken)' : 'rgba(255,255,255,0.05)'
  const divider   = isLight ? 'var(--border-subtle)' : 'rgba(255,255,255,0.05)'
  const hoverBg   = isLight ? 'var(--surface-hover)' : 'rgba(255,255,255,0.06)'
  const selColor  = isLight ? 'var(--text-link)' : '#FFED00'
  const subColor  = isLight ? 'var(--text-tertiary)' : 'rgba(255,255,255,0.35)'

  const triggerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    cursor: 'pointer', userSelect: 'none',
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 10,
    height: 40, padding: '0 12px',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    outline: open ? `2px solid var(--accent-border)` : 'none',
    outlineOffset: 0,
    transition: 'border-color 0.15s, outline 0.1s',
    ...style,
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div
        style={triggerStyle}
        onClick={() => setOpen((p) => !p)}
        role="combobox"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((p) => !p) }
        }}
      >
        <span style={{
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: selected ? textMain : textEmpty,
        }}>
          {selected ? selected.label : placeholder}
        </span>
        {/* Chevron */}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ flexShrink: 0, color: isLight ? 'var(--text-tertiary)' : 'rgba(255,255,255,0.3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000,
          background: dropBg,
          border: `1px solid ${dropBorder}`,
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.15))',
          overflow: 'hidden',
        }}>
          {/* Search row */}
          <div style={{ padding: '7px 7px 5px', borderBottom: `1px solid ${divider}` }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MagnifyingGlass
                size={13}
                style={{ position: 'absolute', left: 9, color: isLight ? 'var(--text-tertiary)' : 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Поиск..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '6px 10px 6px 28px',
                  background: searchBg,
                  border: `1px solid ${dropBorder}`,
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  color: textMain,
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                }}
              />
            </div>
          </div>

          {/* Options */}
          <div ref={listRef} style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{
                padding: '12px 14px',
                fontSize: 'var(--text-sm)',
                color: isLight ? 'var(--text-tertiary)' : 'rgba(255,255,255,0.3)',
                textAlign: 'center',
              }}>
                Ничего не найдено
              </div>
            ) : (
              filtered.map((opt, i) => (
                <div
                  key={opt.value}
                  onClick={() => !opt.disabled && select(opt.value)}
                  style={{
                    padding: '8px 12px',
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    background: i === highlighted ? hoverBg : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    opacity: opt.disabled ? 0.45 : 1,
                    transition: 'background 0.08s',
                  }}
                  onMouseEnter={() => !opt.disabled && setHighlighted(i)}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 'var(--text-sm)',
                      color: opt.value === value ? selColor : textMain,
                      fontWeight: opt.value === value ? 500 : 400,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {opt.label}
                    </div>
                    {opt.subLabel && (
                      <div style={{
                        fontSize: 11,
                        color: subColor,
                        fontFamily: 'var(--font-mono)',
                        marginTop: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {opt.subLabel}
                      </div>
                    )}
                  </div>
                  {/* Selected checkmark */}
                  {opt.value === value && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: selColor }}>
                      <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
