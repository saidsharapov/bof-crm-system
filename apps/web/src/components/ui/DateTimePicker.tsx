import { useState } from 'react'
import { CalendarBlank, CaretLeft, CaretRight, X, Check } from '@phosphor-icons/react'

// ── helpers ───────────────────────────────────────────────────────────────────

const MONTH_RU = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
]
const DOW_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function parseValue(v: string) {
  if (!v) return null
  const d = new Date(v)
  if (isNaN(d.getTime())) return null
  return d
}

function formatDisplay(v: string): string {
  const d = parseValue(v)
  if (!d) return ''
  const dd  = String(d.getDate()).padStart(2, '0')
  const mm  = String(d.getMonth() + 1).padStart(2, '0')
  const hh  = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()} ${hh}:${min}`
}

function buildValue(date: Date, h: number, m: number): string {
  const dd  = String(date.getDate()).padStart(2, '0')
  const mm  = String(date.getMonth() + 1).padStart(2, '0')
  const hh  = String(h).padStart(2, '0')
  const min = String(m).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}T${hh}:${min}`
}

function getCalendarCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  let dow = first.getDay() // 0=Sun
  dow = dow === 0 ? 6 : dow - 1 // Mon=0
  const cells: (Date | null)[] = Array(dow).fill(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function sameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// ── component ─────────────────────────────────────────────────────────────────

interface DateTimePickerProps {
  value: string           // datetime-local format YYYY-MM-DDTHH:mm
  onChange: (v: string) => void
  placeholder?: string
  hasError?: boolean
  style?: React.CSSProperties
  className?: string
}

export function DateTimePicker({ value, onChange, placeholder, hasError, style, className }: DateTimePickerProps) {
  const today = new Date()

  const [open, setOpen] = useState(false)

  // Internal editing state (initialised when opening)
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selDate,   setSelDate]   = useState<Date | null>(null)
  const [hour,      setHour]      = useState(12)
  const [minute,    setMinute]    = useState(0)

  // Sync internal state from prop when opening
  function openPicker() {
    const d = parseValue(value)
    const ref = d ?? today
    setViewYear(ref.getFullYear())
    setViewMonth(ref.getMonth())
    setSelDate(d)
    setHour(d ? d.getHours() : 12)
    setMinute(d ? d.getMinutes() : 0)
    setOpen(true)
  }

  function confirm() {
    if (selDate) onChange(buildValue(selDate, hour, minute))
    setOpen(false)
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setOpen(false)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function clampHour(v: number) { return Math.max(0, Math.min(23, v)) }
  function clampMin(v: number)  { return Math.max(0, Math.min(59, v)) }

  const displayText = formatDisplay(value)
  const cells = getCalendarCells(viewYear, viewMonth)

  // ── styles ──────────────────────────────────────────────────────────────────

  const panelStyle: React.CSSProperties = {
    marginTop: 4,
    background: 'var(--surface-overlay)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-2xl)',
    boxShadow: 'var(--shadow-lg)',
    padding: '16px 16px 12px',
    width: '100%',
  }

  const dayBtnBase: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 'var(--radius-lg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 'var(--text-sm)', border: 'none', cursor: 'pointer',
    transition: 'background var(--dur-fast), color var(--dur-fast)',
    fontFamily: 'var(--font-sans)',
  }

  const timeInputStyle: React.CSSProperties = {
    width: 52, height: 36,
    background: 'var(--surface-sunken)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-md)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    textAlign: 'center',
    outline: 'none',
  }

  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="input-field"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', textAlign: 'left', cursor: 'pointer',
          borderColor: hasError ? 'var(--danger-border)' : undefined,
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarBlank size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <span style={{
            fontSize: 'var(--text-sm)',
            color: displayText ? 'var(--text-primary)' : 'var(--text-disabled)',
            fontFamily: displayText ? 'var(--font-mono)' : 'var(--font-sans)',
          }}>
            {displayText || (placeholder ?? 'Выберите дату и время')}
          </span>
        </span>
        {value && (
          <span
            onClick={clear}
            style={{ color: 'var(--text-tertiary)', display: 'flex', padding: 2, borderRadius: 4 }}
          >
            <X size={12} />
          </span>
        )}
      </button>

      {/* ── Inline panel ── */}
      {open && (
        <div style={panelStyle}>
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button type="button" onClick={prevMonth} style={{ ...dayBtnBase, background: 'var(--surface-sunken)' }}>
              <CaretLeft size={13} />
            </button>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {MONTH_RU[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} style={{ ...dayBtnBase, background: 'var(--surface-sunken)' }}>
              <CaretRight size={13} />
            </button>
          </div>

          {/* Day-of-week header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {DOW_RU.map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-disabled)', padding: '2px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((cell, i) => {
              if (!cell) return <div key={i} />
              const isToday    = sameDay(cell, today)
              const isSelected = sameDay(cell, selDate)
              const isSat = cell.getDay() === 6
              const isSun = cell.getDay() === 0
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelDate(cell)}
                  style={{
                    ...dayBtnBase,
                    width: '100%',
                    background: isSelected
                      ? 'var(--action-primary-bg)'
                      : isToday
                      ? 'var(--accent-soft)'
                      : 'transparent',
                    color: isSelected
                      ? 'var(--action-primary-fg)'
                      : isToday
                      ? 'var(--accent-text)'
                      : isSat || isSun
                      ? 'var(--danger-fg)'
                      : 'var(--text-primary)',
                    fontWeight: isSelected || isToday ? 700 : 400,
                  }}
                >
                  {cell.getDate()}
                </button>
              )
            })}
          </div>

          {/* Time picker */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, padding: '10px 0', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <button type="button" onClick={() => setHour(h => clampHour(h + 1))} style={{ ...dayBtnBase, background: 'var(--surface-sunken)', width: 28, height: 22, borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1 }}>▲</span>
              </button>
              <input
                type="number" min={0} max={23}
                value={String(hour).padStart(2, '0')}
                onChange={e => setHour(clampHour(Number(e.target.value)))}
                style={timeInputStyle}
              />
              <button type="button" onClick={() => setHour(h => clampHour(h - 1))} style={{ ...dayBtnBase, background: 'var(--surface-sunken)', width: 28, height: 22, borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1 }}>▼</span>
              </button>
            </div>

            <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-tertiary)', lineHeight: 1, marginTop: -2 }}>:</span>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <button type="button" onClick={() => setMinute(m => clampMin(m + 5))} style={{ ...dayBtnBase, background: 'var(--surface-sunken)', width: 28, height: 22, borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1 }}>▲</span>
              </button>
              <input
                type="number" min={0} max={59}
                value={String(minute).padStart(2, '0')}
                onChange={e => setMinute(clampMin(Number(e.target.value)))}
                style={timeInputStyle}
              />
              <button type="button" onClick={() => setMinute(m => clampMin(m - 5))} style={{ ...dayBtnBase, background: 'var(--surface-sunken)', width: 28, height: 22, borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1 }}>▼</span>
              </button>
            </div>

            {/* Confirm */}
            <button
              type="button"
              onClick={confirm}
              disabled={!selDate}
              style={{
                marginLeft: 12,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 'var(--radius-lg)',
                border: 'none', cursor: selDate ? 'pointer' : 'not-allowed',
                background: selDate ? 'var(--action-primary-bg)' : 'var(--surface-sunken)',
                color: selDate ? 'var(--action-primary-fg)' : 'var(--text-disabled)',
                fontSize: 'var(--text-sm)', fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--dur-fast)',
              }}
            >
              <Check size={14} weight="bold" />
              Готово
            </button>
          </div>

          {/* Selected date preview */}
          {selDate && (
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', margin: '6px 0 0', fontFamily: 'var(--font-mono)' }}>
              {formatDisplay(buildValue(selDate, hour, minute))}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
