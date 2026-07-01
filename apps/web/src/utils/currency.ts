/**
 * Formats a numeric amount as Uzbek sum (UZS).
 * Example: 1250000 → "1 250 000 UZS"
 */
export function formatUZS(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} UZS`
}

/**
 * Formats a deadline ISO string to "DD.MM.YYYY HH:mm"
 */
export function formatDeadline(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

/**
 * Converts an ISO string to datetime-local input value (YYYY-MM-DDTHH:mm)
 */
export function toDatetimeLocal(iso: string): string {
  const d   = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export type DeadlineStatus = 'overdue' | 'urgent' | 'ok'

/**
 * Returns the urgency status of a deadline.
 * - overdue: past deadline
 * - urgent: less than 24 hours remaining
 * - ok: more than 24 hours remaining
 */
export function getDeadlineStatus(iso: string): DeadlineStatus {
  const now  = Date.now()
  const dl   = new Date(iso).getTime()
  if (dl < now) return 'overdue'
  if (dl - now < 24 * 60 * 60 * 1000) return 'urgent'
  return 'ok'
}
