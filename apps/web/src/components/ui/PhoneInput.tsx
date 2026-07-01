import { useRef } from 'react'

// +998 XX XXX-XX-XX (9 user digits)
const PREFIX = '+998 '

function getUserDigits(v: string): string {
  const all = v.replace(/\D/g, '')
  return all.startsWith('998') ? all.slice(3, 12) : all.slice(0, 9)
}

function buildDisplay(ud: string): string {
  const d = ud.slice(0, 9)
  if (!d) return PREFIX.trimEnd()
  let r = PREFIX + d.slice(0, Math.min(2, d.length))
  if (d.length > 2) r += ' ' + d.slice(2, Math.min(5, d.length))
  if (d.length > 5) r += '-' + d.slice(5, Math.min(7, d.length))
  if (d.length > 7) r += '-' + d.slice(7)
  return r
}

interface PhoneInputProps {
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  className?: string
  style?: React.CSSProperties
  placeholder?: string
}

export function PhoneInput({ value, onChange, onBlur, className, style, placeholder }: PhoneInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  function pushEnd() {
    requestAnimationFrame(() => {
      const el = ref.current
      if (el) el.setSelectionRange(el.value.length, el.value.length)
    })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const ud = getUserDigits(e.target.value)
    onChange(ud ? buildDisplay(ud) : '')
    pushEnd()
  }

  function handleFocus() {
    if (!value) onChange(PREFIX)
    pushEnd()
  }

  function handleBlur() {
    const ud = getUserDigits(value)
    if (!ud) onChange('')
    onBlur?.()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const el = e.currentTarget
    const start = el.selectionStart ?? 0
    const end   = el.selectionEnd   ?? 0
    // Guard the prefix from deletion
    if ((e.key === 'Backspace' || e.key === 'Delete') && start === end && start <= PREFIX.length) {
      e.preventDefault()
    }
    if (e.key === 'Home') {
      e.preventDefault()
      el.setSelectionRange(PREFIX.length, PREFIX.length)
    }
  }

  function handleClick() {
    requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      const pos = el.selectionStart ?? 0
      if (pos < PREFIX.length) el.setSelectionRange(PREFIX.length, PREFIX.length)
    })
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const ud = getUserDigits(e.clipboardData.getData('text'))
    if (ud) { onChange(buildDisplay(ud)); pushEnd() }
  }

  return (
    <input
      ref={ref}
      type="tel"
      value={value || ''}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onPaste={handlePaste}
      className={className}
      style={style}
      placeholder={placeholder ?? '+998 90 123-45-67'}
    />
  )
}
