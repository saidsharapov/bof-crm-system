import { useState, useRef, useCallback, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import clsx from 'clsx'
import {
  Plus, Pencil, Trash, X, MagnifyingGlass,
  Rows, SquaresFour,
} from '@phosphor-icons/react'
import { useOrderStore, type Order, type OrderStatus, calcTotal } from '@/store/orderStore'
import { formatUZS, formatDeadline, getDeadlineStatus, toDatetimeLocal } from '@/utils/currency'
import { useOrderSourceStore } from '@/store/orderSourceStore'
import { useProductStore } from '@/store/productStore'
import { useStockStore } from '@/store/stockStore'
import { useAuthStore } from '@/store/authStore'
import { SearchSelect } from '@/components/ui/SearchSelect'
import { NumberInput }  from '@/components/ui/NumberInput'
import { PhoneInput }   from '@/components/ui/PhoneInput'
import { DateTimePicker } from '@/components/ui/DateTimePicker'

// ── Status meta ───────────────────────────────────────────────────────────────
const STATUS_META: Record<OrderStatus, {
  label: string
  chip: React.CSSProperties
  bar: string
  dot: string
}> = {
  NEW:        {
    label: 'Новый',
    chip: { color: 'var(--warning-fg)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' },
    bar: 'bg-amber-400',
    dot: 'var(--warning-fg)',
  },
  IN_WORK:    {
    label: 'В работе',
    chip: { color: 'var(--info-fg)', background: 'var(--info-bg)', border: '1px solid var(--info-border)' },
    bar: 'bg-blue-500',
    dot: 'var(--info-fg)',
  },
  DELIVERING: {
    label: 'Доставка',
    chip: { color: 'var(--accent-text)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' },
    bar: 'bg-violet-400',
    dot: 'var(--accent-text)',
  },
  DELIVERED:  {
    label: 'Доставлен',
    chip: { color: 'var(--success-fg)', background: 'var(--success-bg)', border: '1px solid var(--success-border)' },
    bar: 'bg-emerald-500',
    dot: 'var(--success-fg)',
  },
  CANCELED:   {
    label: 'Отменён',
    chip: { color: 'var(--danger-fg)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' },
    bar: 'bg-red-500',
    dot: 'var(--danger-fg)',
  },
}

const ALL_STATUSES: OrderStatus[] = ['NEW', 'IN_WORK', 'DELIVERING', 'DELIVERED', 'CANCELED']

// ── Form schema ───────────────────────────────────────────────────────────────
const schema = z.object({
  clientName: z.string().min(1, 'Введите клиента'),
  phone:      z.string().min(1, 'Введите телефон'),
  address:    z.string().default(''),
  comment:    z.string().default(''),
  source:     z.string().default(''),
  deadline:   z.string().min(1, 'Укажите срок исполнения'),
  status:     z.enum(['NEW', 'IN_WORK', 'DELIVERING', 'DELIVERED', 'CANCELED']),
  items:      z
    .array(z.object({ productId: z.string().min(1, 'Выберите товар'), qty: z.coerce.number().min(1), price: z.coerce.number().min(0).default(0) }))
    .min(1, 'Добавьте хотя бы один товар'),
})
type FormData = z.infer<typeof schema>

// ── Shared button helpers ─────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-2xs)',
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-caps)',
}

// ── Order modal ───────────────────────────────────────────────────────────────
function OrderModal({ target, onClose }: { target: 'new' | Order; onClose: () => void }) {
  const { createOrder, updateOrder } = useOrderStore()
  const { sources } = useOrderSourceStore()
  const { products } = useProductStore()
  const { getStock, addMovement } = useStockStore()
  const { user } = useAuthStore()
  const isNew  = target === 'new'
  const order  = isNew ? null : (target as Order)

  const activeSources = sources.filter((s) => !s.archived)

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: order
      ? { clientName: order.clientName, phone: order.phone, address: order.address, comment: order.comment, source: order.source ?? '', deadline: order.deadline ? toDatetimeLocal(order.deadline) : '', status: order.status, items: order.items.map((it) => ({ productId: it.productId, qty: it.qty, price: it.price ?? 0 })) }
      : { status: 'NEW', address: '', comment: '', source: '', deadline: '', items: [{ productId: '', qty: 1, price: 0 }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems  = watch('items')
  const watchedSource = watch('source')
  const liveTotal = calcTotal((watchedItems ?? []).map((it) => ({ productId: it.productId, qty: Number(it.qty) || 0, price: Number(it.price) || 0 })))

  function applyStockMovement(
    orderNum: string,
    items: { productId: string; qty: number }[],
    direction: 'OUT' | 'IN',
  ) {
    const actor  = user?.name ?? 'CRM'
    const prefix = direction === 'OUT' ? 'Отгрузка' : 'Возврат'
    items.forEach((item) => {
      addMovement(item.productId, direction, item.qty, `${prefix} заказ ${orderNum}`, actor)
    })
  }

  function onSubmit(data: FormData) {
    const deadlineISO = data.deadline ? new Date(data.deadline).toISOString() : undefined
    if (isNew) {
      createOrder({ clientName: data.clientName, phone: data.phone, address: data.address, comment: data.comment, source: data.source || undefined, deadline: deadlineISO, items: data.items })
    } else if (order) {
      const prevStatus = order.status
      const nextStatus = data.status
      if (prevStatus !== nextStatus) {
        if (nextStatus === 'DELIVERED' && prevStatus !== 'DELIVERED') {
          applyStockMovement(order.num, data.items, 'OUT')
        } else if (prevStatus === 'DELIVERED' && nextStatus !== 'DELIVERED') {
          applyStockMovement(order.num, order.items, 'IN')
        }
      }
      updateOrder(order.id, { clientName: data.clientName, phone: data.phone, address: data.address, comment: data.comment, source: data.source || undefined, deadline: deadlineISO, status: data.status, items: data.items })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'var(--scrim)' }} onClick={onClose} />
      <div
        className="relative animate-fade-up"
        style={{
          background: 'var(--surface-overlay)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: '0 12px 24px rgba(16,18,27,0.15)',
          width: 580,
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {isNew ? 'Создать заказ' : `Заказ ${order?.num}`}
          </h2>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Клиент</label>
              <input
                {...register('clientName')}
                className="input-field"
                placeholder="Имя клиента / Организация"
                title="Например: Иван Иванов, ООО Textile Group, ИП Каримов"
              />
              {errors.clientName && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-fg)', margin: 0 }}>{errors.clientName.message}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Телефон</label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className="input-field"
                    style={{ borderColor: errors.phone ? 'var(--danger-border)' : undefined }}
                  />
                )}
              />
              {errors.phone && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-fg)', margin: 0 }}>{errors.phone.message}</p>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Адрес</label>
              <input {...register('address')} className="input-field" placeholder="Москва, ул. Ленина, 12" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Источник заказа</label>
              <SearchSelect
                value={watchedSource ?? ''}
                onChange={(v) => setValue('source', v)}
                options={[
                  { value: '', label: '— не указан —' },
                  ...activeSources.map((s) => ({ value: s.id, label: s.name })),
                ]}
                placeholder="— не указан —"
                style={{ height: 40 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Комментарий</label>
              <textarea {...register('comment')} rows={2} className="input-field" style={{ resize: 'none' }} placeholder="Примечания к заказу..." />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ ...labelStyle, color: errors.deadline ? 'var(--danger-fg)' : undefined }}>
                Срок исполнения <span style={{ color: 'var(--danger-fg)' }}>*</span>
              </label>
              <Controller
                name="deadline"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Выберите дату и время"
                    hasError={!!errors.deadline}
                  />
                )}
              />
              {errors.deadline && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-fg)', margin: 0 }}>{errors.deadline.message}</p>
              )}
            </div>
          </div>

          {!isNew && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Статус</label>
              <select {...register('status')} className="input-field">
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>Товары</label>
            {errors.items && typeof errors.items.message === 'string' && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-fg)', margin: 0 }}>{errors.items.message}</p>
            )}
            {fields.map((field, idx) => {
              const pid       = watchedItems?.[idx]?.productId
              const stock     = pid ? getStock(pid) : null
              const qty       = Number(watchedItems?.[idx]?.qty) || 0
              const overStock = stock !== null && qty > stock

              return (
                <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="hidden" {...register(`items.${idx}.productId`)} />
                    <div style={{ flex: 1 }}>
                      <SearchSelect
                        value={pid ?? ''}
                        onChange={(v) => setValue(`items.${idx}.productId`, v, { shouldValidate: true })}
                        options={[
                          { value: '', label: '— выберите товар —' },
                          ...products.map((p) => {
                            const s = getStock(p.id)
                            return {
                              value: p.id,
                              label: `${p.name} (${p.size}, ${p.color})`,
                              subLabel: `${p.article} · ${s} шт на складе`,
                            }
                          }),
                        ]}
                        placeholder="— выберите товар —"
                        hasError={!!errors.items?.[idx]?.productId}
                      />
                    </div>
                    <Controller
                      name={`items.${idx}.qty`}
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          value={field.value ?? 1}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          min={1}
                          placeholder="Кол-во"
                          className="input-field"
                          style={{ width: 80, textAlign: 'center', borderColor: overStock ? 'var(--danger-solid)' : undefined }}
                        />
                      )}
                    />
                    <Controller
                      name={`items.${idx}.price`}
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          value={field.value ?? 0}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          min={0}
                          placeholder="Цена, UZS"
                          className="input-field"
                          style={{ width: 112, textAlign: 'right' }}
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', flexShrink: 0 }}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                  {stock !== null && (
                    <p style={{ fontSize: 11, paddingLeft: 4, margin: 0, color: overStock ? 'var(--danger-fg)' : 'var(--text-tertiary)' }}>
                      {overStock
                        ? `Предупреждение: на складе только ${stock} шт — не хватает ${qty - stock} шт`
                        : `На складе: ${stock} шт`}
                    </p>
                  )}
                </div>
              )
            })}
            <button
              type="button"
              onClick={() => append({ productId: '', qty: 1, price: 0 })}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--text-link)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: 0 }}
            >
              <Plus size={14} />
              Добавить товар
            </button>
          </div>

          {/* Order total */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            background: liveTotal > 0 ? 'var(--success-bg)' : 'var(--bg-subtle)',
            border: `1px solid ${liveTotal > 0 ? 'var(--success-border)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-lg)',
          }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Сумма заказа
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 700, color: liveTotal > 0 ? 'var(--success-fg)' : 'var(--text-tertiary)' }}>
              {liveTotal > 0 ? formatUZS(liveTotal) : '—'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', background: 'transparent', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}
            >
              Отмена
            </button>
            <button
              type="submit"
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 500, background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)' }}
            >
              {isNew ? 'Создать заказ' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Kanban card ───────────────────────────────────────────────────────────────
function KanbanCard({
  order,
  onEdit,
  onPointerDown,
}: {
  order: Order
  onEdit: () => void
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
}) {
  const date = new Date(order.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: 14,
        boxShadow: 'var(--shadow-xs)',
        cursor: 'grab',
        transition: 'box-shadow var(--dur-base), transform var(--dur-base)',
        userSelect: 'none',
      }}
      onPointerDown={onPointerDown}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = 'var(--shadow-md)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = 'var(--shadow-xs)'
        el.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)' }}>{order.num}</span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onEdit}
          style={{
            width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--text-tertiary)',
          }}
        >
          <Pencil size={12} />
        </button>
      </div>
      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 4px' }}>{order.clientName}</p>
      {order.comment && (
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 8px' }}>{order.comment}</p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {order.items.reduce((s, i) => s + i.qty, 0)} шт
        </span>
        {order.totalAmount ? (
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {formatUZS(order.totalAmount)}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{date}</span>
        )}
      </div>
      {order.totalAmount ? (
        <div style={{ marginTop: 4, textAlign: 'right', fontSize: 10, color: 'var(--text-disabled)' }}>{date}</div>
      ) : null}
      {order.deadline && (() => {
        const ds = getDeadlineStatus(order.deadline)
        const chipSt: React.CSSProperties = ds === 'overdue'
          ? { marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--danger-fg)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '2px 7px', borderRadius: 6 }
          : ds === 'urgent'
          ? { marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--warning-fg)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', padding: '2px 7px', borderRadius: 6 }
          : { marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-tertiary)' }
        return (
          <div style={chipSt}>
            {ds === 'overdue' ? '⚠' : ds === 'urgent' ? '⏰' : '📅'} {formatDeadline(order.deadline)}
          </div>
        )
      })()}
    </div>
  )
}

// ── Kanban board ──────────────────────────────────────────────────────────────
function KanbanBoard({ orders, onEdit }: { orders: Order[]; onEdit: (o: Order) => void }) {
  const { setStatus } = useOrderStore()
  const { addMovement } = useStockStore()
  const { user } = useAuthStore()

  const drag = useRef<{
    orderId: string
    ghost: HTMLElement
    offsetX: number
    offsetY: number
    activeCol: OrderStatus | null
  } | null>(null)

  const colRefs = useRef<Map<OrderStatus, HTMLDivElement>>(new Map())

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, orderId: string) => {
      e.preventDefault()
      const rect = e.currentTarget.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top

      const ghost = e.currentTarget.cloneNode(true) as HTMLElement
      Object.assign(ghost.style, {
        position: 'fixed',
        zIndex: '9999',
        width: `${rect.width}px`,
        left: `${e.clientX - offsetX}px`,
        top: `${e.clientY - offsetY}px`,
        opacity: '0.92',
        transform: 'rotate(1.5deg) scale(1.03)',
        pointerEvents: 'none',
        transition: 'none',
        boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
      })
      document.body.appendChild(ghost)

      drag.current = { orderId, ghost, offsetX, offsetY, activeCol: null }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [],
  )

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return

    d.ghost.style.left = `${e.clientX - d.offsetX}px`
    d.ghost.style.top  = `${e.clientY - d.offsetY}px`

    let hit: OrderStatus | null = null
    colRefs.current.forEach((el, status) => {
      const r = el.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        hit = status
      }
    })
    if (hit !== d.activeCol) {
      if (d.activeCol) {
        const el = colRefs.current.get(d.activeCol)
        if (el) el.style.background = 'var(--bg-subtle)'
      }
      if (hit) {
        const el = colRefs.current.get(hit)
        if (el) el.style.background = 'var(--accent-subtle)'
      }
      d.activeCol = hit
    }
  }, [])

  const handlePointerUp = useCallback((_e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return

    if (d.activeCol) {
      const newStatus = d.activeCol
      const order     = orders.find((o) => o.id === d.orderId)

      if (order && order.status !== newStatus) {
        const actor = user?.name ?? 'CRM'

        if (newStatus === 'DELIVERED' && order.status !== 'DELIVERED') {
          order.items.forEach((item) => {
            addMovement(item.productId, 'OUT', item.qty, `Отгрузка заказ ${order.num}`, actor)
          })
        } else if (order.status === 'DELIVERED' && newStatus !== 'DELIVERED') {
          order.items.forEach((item) => {
            addMovement(item.productId, 'IN', item.qty, `Возврат заказ ${order.num}`, actor)
          })
        }
      }

      setStatus(d.orderId, newStatus)
      const el = colRefs.current.get(d.activeCol)
      if (el) el.style.background = 'var(--bg-subtle)'
    }

    d.ghost.remove()
    drag.current = null
  }, [setStatus, addMovement, user, orders])

  const byStatus = (s: OrderStatus) => orders.filter((o) => o.status === s)

  return (
    <div
      style={{ display: 'flex', gap: 16, height: '100%', overflowX: 'auto', paddingBottom: 8 }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {ALL_STATUSES.map((status) => {
        const meta = STATUS_META[status]
        const col  = byStatus(status)

        return (
          <div
            key={status}
            ref={(el) => { if (el) colRefs.current.set(status, el); else colRefs.current.delete(status) }}
            style={{
              width: 240,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-2xl)',
              overflow: 'hidden',
              transition: 'background var(--dur-fast)',
            }}
          >
            {/* Column header */}
            <div style={{ padding: '14px 14px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{meta.label}</span>
                </div>
                <span style={{
                  fontSize: 'var(--text-xs)', fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  padding: '1px 8px', borderRadius: 'var(--radius-full)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {col.length}
                </span>
              </div>
              {/* Colored status bar */}
              <div className={clsx('mt-3 h-[2px] rounded-full opacity-60', meta.bar)} />
            </div>

            {/* Cards */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
              {col.map((order) => (
                <KanbanCard
                  key={order.id}
                  order={order}
                  onEdit={() => onEdit(order)}
                  onPointerDown={(e) => handlePointerDown(e, order.id)}
                />
              ))}
              {col.length === 0 && (
                <div style={{
                  height: 80,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px dashed var(--border-default)',
                }}>
                  <p style={{ fontSize: 11, color: 'var(--text-disabled)', margin: 0 }}>Нет заказов</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── OrdersDesktop ─────────────────────────────────────────────────────────────
export function OrdersDesktop() {
  const { orders, removeOrder, fetch: fetchOrders } = useOrderStore()
  const { sources, fetch: fetchSources } = useOrderSourceStore()
  const [view, setView]               = useState<'table' | 'kanban'>('table')

  useEffect(() => {
    fetchOrders()
    fetchSources()
  }, [])
  const [activeTab, setActiveTab]     = useState<'ALL' | OrderStatus>('ALL')
  const [search, setSearch]           = useState('')
  const [modalTarget, setModalTarget] = useState<null | 'new' | Order>(null)
  const [sortByDeadline, setSortByDeadline] = useState<'asc' | 'desc' | null>(null)

  const filtered = orders
    .filter((o) => {
      const matchTab    = activeTab === 'ALL' || o.status === activeTab
      const q           = search.toLowerCase()
      const matchSearch = !q || o.clientName.toLowerCase().includes(q) || o.num.includes(q) ||
        (o.deadline ? formatDeadline(o.deadline).includes(q) : false)
      return matchTab && matchSearch
    })
    .sort((a, b) => {
      if (!sortByDeadline) return 0
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity
      return sortByDeadline === 'asc' ? da - db : db - da
    })

  const kanbanOrders = orders.filter((o) => {
    const q = search.toLowerCase()
    return !q || o.clientName.toLowerCase().includes(q) || o.num.includes(q)
  })

  function countByStatus(s: 'ALL' | OrderStatus) {
    return s === 'ALL' ? orders.length : orders.filter((o) => o.status === s).length
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const TABS: ('ALL' | OrderStatus)[] = ['ALL', ...ALL_STATUSES]

  return (
    <div style={{ maxWidth: view === 'kanban' ? 'none' : 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)', margin: 0 }}>Заказы</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>{orders.length} всего</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* View toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--surface-sunken)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 2,
          }}>
            <button
              onClick={() => setView('table')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 'var(--radius-md)',
                border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-sm)', fontWeight: 500,
                background: view === 'table' ? 'var(--surface-card)' : 'transparent',
                color: view === 'table' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: view === 'table' ? 'var(--shadow-xs)' : 'none',
                transition: 'background var(--dur-fast)',
              }}
            >
              <Rows size={15} />
              Список
            </button>
            <button
              onClick={() => setView('kanban')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 'var(--radius-md)',
                border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-sm)', fontWeight: 500,
                background: view === 'kanban' ? 'var(--surface-card)' : 'transparent',
                color: view === 'kanban' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: view === 'kanban' ? 'var(--shadow-xs)' : 'none',
                transition: 'background var(--dur-fast)',
              }}
            >
              <SquaresFour size={15} />
              Канбан
            </button>
          </div>

          <button
            onClick={() => setModalTarget('new')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 'var(--radius-lg)',
              border: 'none', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: 500,
              background: 'var(--action-primary-bg)',
              color: 'var(--action-primary-fg)',
            }}
          >
            <Plus size={16} />
            Создать заказ
          </button>
        </div>
      </div>

      {/* Table view */}
      {view === 'table' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <MagnifyingGlass size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по клиенту или номеру..."
                style={{
                  width: 256, height: 36,
                  padding: '0 12px 0 36px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '5px 12px', borderRadius: 'var(--radius-lg)',
                    border: 'none', cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                    background: activeTab === tab ? 'var(--surface-card)' : 'transparent',
                    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    fontWeight: activeTab === tab ? 600 : 400,
                    boxShadow: activeTab === tab ? 'var(--shadow-xs)' : 'none',
                    transition: 'background var(--dur-fast)',
                  }}
                >
                  {tab === 'ALL' ? 'Все' : STATUS_META[tab].label}
                  <span style={{ marginLeft: 6, fontSize: 'var(--text-xs)', color: 'var(--text-disabled)' }}>({countByStatus(tab)})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {['#', 'Клиент', 'Источник', 'Товаров', 'Сумма', 'Статус', 'Срок', 'Дата', ''].map((h, i) => (
                    <th
                      key={i}
                      onClick={h === 'Срок' ? () => setSortByDeadline((s) => s === 'asc' ? 'desc' : 'asc') : undefined}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 600,
                        color: h === 'Срок' ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: 'var(--tracking-caps)',
                        cursor: h === 'Срок' ? 'pointer' : 'default',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}{h === 'Срок' && (sortByDeadline === 'asc' ? ' ↑' : sortByDeadline === 'desc' ? ' ↓' : ' ↕')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                      Заказы не найдены
                    </td>
                  </tr>
                ) : (
                  filtered.map((o) => (
                    <tr
                      key={o.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background var(--dur-fast)' }}
                      onClick={() => setModalTarget(o)}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-hover)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}
                    >
                      <td style={{ padding: '13px 16px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-tertiary)' }}>{o.num}</td>
                      <td style={{ padding: '13px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>{o.clientName}</td>
                      <td style={{ padding: '13px 16px', fontSize: 'var(--text-sm)', color: o.source ? 'var(--text-secondary)' : 'var(--text-disabled)' }}>
                        {o.source ? (sources.find((s) => s.id === o.source)?.name ?? '—') : '—'}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                        {o.items.reduce((s, i) => s + i.qty, 0)} шт
                        <span style={{ color: 'var(--text-disabled)', marginLeft: 4, fontSize: 11 }}>({o.items.length} поз.)</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: o.totalAmount ? 'var(--text-primary)' : 'var(--text-disabled)' }}>
                        {o.totalAmount ? formatUZS(o.totalAmount) : '—'}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          padding: '2px 8px', borderRadius: 6,
                          ...STATUS_META[o.status].chip,
                        }}>
                          {STATUS_META[o.status].label}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {o.deadline ? (() => {
                          const ds = getDeadlineStatus(o.deadline)
                          const chipStyle: React.CSSProperties = ds === 'overdue'
                            ? { color: 'var(--danger-fg)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '2px 7px', borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }
                            : ds === 'urgent'
                            ? { color: 'var(--warning-fg)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', padding: '2px 7px', borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }
                            : { color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }
                          return <span style={chipStyle}>{ds === 'overdue' ? '⚠ ' : ds === 'urgent' ? '⏰ ' : ''}{formatDeadline(o.deadline)}</span>
                        })() : <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{formatDate(o.createdAt)}</td>
                      <td style={{ padding: '13px 16px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button
                            onClick={() => setModalTarget(o)}
                            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => { if (window.confirm(`Удалить заказ ${o.num}?`)) removeOrder(o.id) }}
                            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <>
          <div style={{ position: 'relative', maxWidth: 320, marginBottom: 16 }}>
            <MagnifyingGlass size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              style={{
                width: '100%', height: 36,
                padding: '0 12px 0 36px',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                background: 'var(--surface-sunken)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ height: 'calc(100vh - 260px)' }}>
            <KanbanBoard orders={kanbanOrders} onEdit={(o) => setModalTarget(o)} />
          </div>
        </>
      )}

      {/* Modal */}
      {modalTarget !== null && (
        <OrderModal target={modalTarget} onClose={() => setModalTarget(null)} />
      )}
    </div>
  )
}
