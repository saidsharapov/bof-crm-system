import { useState, useRef, useEffect, useCallback } from 'react'
import { CalendarBlank } from '@phosphor-icons/react'
import { BottomSheet } from './BottomSheet'

// ── constants ─────────────────────────────────────────────────────────────────

const ITEM_H  = 44   // px per wheel item
const VISIBLE = 5    // visible items
const PAD_H   = Math.floor(VISIBLE / 2) * ITEM_H  // 88px padding top+bottom

const MONTH_RU_SHORT = [
  'Янв','Фев','Мар','Апр','Май','Июн',
  'Июл','Авг','Сен','Окт','Ноя','Дек',
]

function getYearItems() {
  const now = new Date().getFullYear()
  const items: string[] = []
  for (let y = now - 1; y <= now + 6; y++) items.push(String(y))
  return items
}

const YEAR_ITEMS   = getYearItems()
const YEAR_BASE    = new Date().getFullYear() - 1
const HOUR_ITEMS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTE_ITEMS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

function getDayItems(month: number, year: number) {
  const maxDay = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: maxDay }, (_, i) => String(i + 1).padStart(2, '0'))
}

// ── WheelColumn ───────────────────────────────────────────────────────────────

interface WheelColumnProps {
  items: string[]
  selectedIndex: number
  onChange: (i: number) => void
  flex?: number
}

function WheelColumn({ items, selectedIndex, onChange, flex = 1 }: WheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout>>()
  const busy      = useRef(false)

  // Mount: jump to initial index without animation
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = selectedIndex * ITEM_H
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // External selectedIndex change (e.g., month change trimming day count)
  useEffect(() => {
    const el = scrollRef.current
    if (!el || busy.current) return
    const target = selectedIndex * ITEM_H
    if (Math.abs(el.scrollTop - target) > 2) {
      el.scrollTo({ top: target, behavior: 'smooth' })
    }
  }, [selectedIndex])

  const handleScroll = useCallback(() => {
    busy.current = true
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const el = scrollRef.current
      if (!el) return
      const idx     = Math.round(el.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(items.length - 1, idx))
      busy.current  = false
      onChange(clamped)
      el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' })
    }, 120)
  }, [items.length, onChange])

  return (
    <div style={{ flex, position: 'relative', height: VISIBLE * ITEM_H, overflow: 'hidden' }}>
      {/* Top fade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: PAD_H,
        background: 'linear-gradient(to bottom, var(--surface-overlay) 30%, transparent)',
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* Selection highlight */}
      <div style={{
        position: 'absolute', left: 4, right: 4,
        top: PAD_H, height: ITEM_H,
        background: 'var(--surface-active)',
        borderRadius: 'var(--radius-lg)',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: PAD_H,
        background: 'linear-gradient(to top, var(--surface-overlay) 30%, transparent)',
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* Scroll track */}
      <div
        ref={scrollRef}
        className="wheel-scroll"
        onScroll={handleScroll}
        style={{
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        } as React.CSSProperties}
      >
        <div style={{ height: PAD_H, flexShrink: 0 }} />

        {items.map((item, i) => {
          const dist = Math.abs(i - selectedIndex)
          return (
            <div
              key={i}
              style={{
                height: ITEM_H,
                scrollSnapAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: dist === 0 ? 18 : dist === 1 ? 15 : 13,
                fontWeight: dist === 0 ? 700 : 400,
                color: dist === 0
                  ? 'var(--text-primary)'
                  : dist === 1
                  ? 'var(--text-secondary)'
                  : 'var(--text-disabled)',
                cursor: 'pointer',
                userSelect: 'none',
                fontFamily: 'var(--font-sans)',
                transition: 'font-size 80ms, color 80ms',
              }}
              onClick={() => {
                onChange(i)
                scrollRef.current?.scrollTo({ top: i * ITEM_H, behavior: 'smooth' })
              }}
            >
              {item}
            </div>
          )
        })}

        <div style={{ height: PAD_H, flexShrink: 0 }} />
      </div>
    </div>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────

function parseValue(v: string) {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
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

function buildValue(year: number, month: number, day: number, hour: number, minute: number): string {
  const mm  = String(month + 1).padStart(2, '0')
  const dd  = String(day).padStart(2, '0')
  const hh  = String(hour).padStart(2, '0')
  const min = String(minute * 5).padStart(2, '0')
  return `${year}-${mm}-${dd}T${hh}:${min}`
}

// ── DateTimePickerMobile ──────────────────────────────────────────────────────

interface DateTimePickerMobileProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hasError?: boolean
}

export function DateTimePickerMobile({ value, onChange, placeholder, hasError }: DateTimePickerMobileProps) {
  const today = new Date()

  const [open, setOpen] = useState(false)

  // Internal picker state (indices)
  const [dayIdx,    setDayIdx]    = useState(0)
  const [monthIdx,  setMonthIdx]  = useState(today.getMonth())
  const [yearIdx,   setYearIdx]   = useState(1)                // offset from YEAR_BASE
  const [hourIdx,   setHourIdx]   = useState(12)
  const [minuteIdx, setMinuteIdx] = useState(0)

  function initFromValue() {
    const d = parseValue(value)
    const ref = d ?? today
    const yIdx  = Math.max(0, ref.getFullYear() - YEAR_BASE)
    const mIdx  = ref.getMonth()
    const dIdx  = ref.getDate() - 1
    const hIdx  = d ? d.getHours() : today.getHours()
    const minRaw = d ? d.getMinutes() : 0
    const minIdx = Math.round(minRaw / 5) % 12

    setYearIdx(Math.min(yIdx, YEAR_ITEMS.length - 1))
    setMonthIdx(mIdx)
    setDayIdx(dIdx)
    setHourIdx(hIdx)
    setMinuteIdx(minIdx)
  }

  function openPicker() {
    initFromValue()
    setOpen(true)
  }

  const curYear  = YEAR_BASE + yearIdx
  const dayItems = getDayItems(monthIdx, curYear)
  const maxDayIdx = dayItems.length - 1

  // Clamp day when month/year changes
  useEffect(() => {
    if (dayIdx > maxDayIdx) setDayIdx(maxDayIdx)
  }, [monthIdx, yearIdx, maxDayIdx, dayIdx])

  function confirm() {
    const day  = Math.min(dayIdx, maxDayIdx) + 1
    onChange(buildValue(curYear, monthIdx, day, hourIdx, minuteIdx))
    setOpen(false)
  }

  const displayText = formatDisplay(value)

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={openPicker}
        className="input-field"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', textAlign: 'left', cursor: 'pointer',
          borderColor: hasError ? 'var(--danger-border)' : undefined,
        }}
      >
        <CalendarBlank size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        <span style={{
          fontSize: 'var(--text-sm)',
          color: displayText ? 'var(--text-primary)' : 'var(--text-disabled)',
          fontFamily: displayText ? 'var(--font-mono)' : 'var(--font-sans)',
        }}>
          {displayText || (placeholder ?? 'Выберите дату и время')}
        </span>
      </button>

      {/* Bottom sheet with wheels */}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Срок исполнения"
      >
        <div style={{ padding: '4px 16px 32px' }}>
          {/* Wheels */}
          <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
            {/* Day */}
            <WheelColumn
              items={dayItems}
              selectedIndex={Math.min(dayIdx, maxDayIdx)}
              onChange={setDayIdx}
              flex={1}
            />

            {/* Month */}
            <WheelColumn
              items={MONTH_RU_SHORT}
              selectedIndex={monthIdx}
              onChange={setMonthIdx}
              flex={1.4}
            />

            {/* Year */}
            <WheelColumn
              items={YEAR_ITEMS}
              selectedIndex={yearIdx}
              onChange={setYearIdx}
              flex={1.2}
            />

            {/* Divider */}
            <div style={{
              width: 1, alignSelf: 'center', height: 32,
              background: 'var(--border-default)',
              margin: '0 2px',
              flexShrink: 0,
            }} />

            {/* Hour */}
            <WheelColumn
              items={HOUR_ITEMS}
              selectedIndex={hourIdx}
              onChange={setHourIdx}
              flex={0.9}
            />

            {/* Colon */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 14 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-tertiary)', lineHeight: 1, marginTop: -4 }}>:</span>
            </div>

            {/* Minute */}
            <WheelColumn
              items={MINUTE_ITEMS}
              selectedIndex={minuteIdx}
              onChange={setMinuteIdx}
              flex={0.9}
            />
          </div>

          {/* Preview */}
          <p style={{
            textAlign: 'center', fontSize: 13, fontFamily: 'var(--font-mono)',
            color: 'var(--text-tertiary)', margin: '12px 0 16px',
          }}>
            {String(Math.min(dayIdx, maxDayIdx) + 1).padStart(2,'0')}.{String(monthIdx + 1).padStart(2,'0')}.{curYear}
            {' '}{String(hourIdx).padStart(2,'0')}:{String(minuteIdx * 5).padStart(2,'0')}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-default)', background: 'none',
                fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={confirm}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 'var(--radius-xl)',
                border: 'none', background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)',
                fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Готово
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
