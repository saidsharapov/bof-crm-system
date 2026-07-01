import { useRef, useState } from 'react'
import type { FocusEvent, InputHTMLAttributes } from 'react'

interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'min' | 'max'> {
  /** Committed numeric value from the parent. */
  value: number
  /** Called with the parsed number only on blur (or when min-clamped). */
  onChange: (value: number) => void
  min?: number
  max?: number
  /** Allow a decimal point in input. Default: false (integers only). */
  decimals?: boolean
}

/**
 * Numeric input that:
 * - Uses type="text" to avoid native browser number-input quirks
 * - Lets the user fully clear the field during editing
 * - Strips leading zeros on the fly  (e.g. "022" → "22")
 * - Converts to a number only on blur
 * - Syncs display when the parent changes the value externally
 *   (stepper buttons, quick-set buttons, etc.)
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  decimals = false,
  onBlur,
  ...rest
}: NumberInputProps) {
  const [raw, setRaw] = useState<string>(() => (value === 0 ? '' : String(value)))

  // "getDerivedStateFromProps" pattern: sync when parent value changes externally
  const lastCommitted = useRef(value)
  if (lastCommitted.current !== value) {
    lastCommitted.current = value
    setRaw(value === 0 ? '' : String(value))
  }

  function sanitize(s: string): string {
    if (decimals) {
      // Keep digits and at most one decimal point
      s = s.replace(/[^0-9.]/g, '')
      const dot = s.indexOf('.')
      if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '')
    } else {
      s = s.replace(/[^0-9]/g, '')
    }
    // Strip leading zeros before a non-zero digit  ("022" → "22", "007" → "7")
    s = s.replace(/^0+([1-9])/, '$1')
    return s
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRaw(sanitize(e.target.value))
  }

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    const parsed = decimals ? parseFloat(raw) : parseInt(raw, 10)
    let n = isNaN(parsed) ? (min ?? 0) : parsed
    if (min !== undefined) n = Math.max(min, n)
    if (max !== undefined) n = Math.min(max, n)

    lastCommitted.current = n
    setRaw(n === 0 ? '' : String(n))
    onChange(n)
    onBlur?.(e)
  }

  return (
    <input
      {...rest}
      type="text"
      inputMode={decimals ? 'decimal' : 'numeric'}
      value={raw}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}
