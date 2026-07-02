import React, { useState, useRef, useCallback, useEffect } from 'react'
import { z } from 'zod'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus, Trash, Phone, MapPin, Note, WarningCircle,
  DotsSixVertical, List, Kanban,
} from '@phosphor-icons/react'
import { useOrderStore, type Order, type OrderStatus, calcTotal } from '@/store/orderStore'
import { formatUZS, formatDeadline, getDeadlineStatus, toDatetimeLocal } from '@/utils/currency'
import { useOrderSourceStore } from '@/store/orderSourceStore'
import { useProductStore } from '@/store/productStore'
import { useStockStore }   from '@/store/stockStore'
import { SearchSelect }    from '@/components/ui/SearchSelect'
import { ProductAvatar }   from '@/components/products/ProductAvatar'
import { NumberInput }     from '@/components/ui/NumberInput'
import { BottomSheet }     from '@/components/ui/BottomSheet'
import { SearchBar }       from '@/components/ui/SearchBar'
import { PageHeader }      from '@/components/ui/PageHeader'
import { EmptyState }      from '@/components/ui/EmptyState'
import { PhoneInput }      from '@/components/ui/PhoneInput'
import { DateTimePickerMobile } from '@/components/ui/DateTimePickerMobile'

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const STATUS_META: Record<OrderStatus, { label: string; dot: string; chip: React.CSSProperties }> = {
  NEW:        { label: 'Новый',        dot: 'var(--warning-fg)',  chip: { color: 'var(--warning-fg)',  background: 'var(--warning-bg)',  border: '1px solid var(--warning-border)'  } },
  IN_WORK:    { label: 'В работе',     dot: 'var(--info-fg)',     chip: { color: 'var(--info-fg)',     background: 'var(--info-bg)',     border: '1px solid var(--info-border)'     } },
  DELIVERING: { label: 'Доставляется', dot: 'var(--accent-text)', chip: { color: 'var(--accent-text)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)'   } },
  DELIVERED:  { label: 'Доставлен',    dot: 'var(--success-fg)',  chip: { color: 'var(--success-fg)',  background: 'var(--success-bg)',  border: '1px solid var(--success-border)'  } },
  CANCELED:   { label: 'Отменён',      dot: 'var(--danger-fg)',   chip: { color: 'var(--danger-fg)',   background: 'var(--danger-bg)',   border: '1px solid var(--danger-border)'   } },
}

const STATUS_ORDER: OrderStatus[] = ['NEW', 'IN_WORK', 'DELIVERING', 'DELIVERED', 'CANCELED']

// ═══════════════════════════════════════════════════════════════════════════════
// ORDER FORM (create / edit)
// ═══════════════════════════════════════════════════════════════════════════════

const schema = z.object({
  clientName: z.string().min(1, 'Введите имя клиента'),
  phone:      z.string().min(1, 'Введите телефон'),
  address:    z.string().min(1, 'Введите адрес'),
  comment:    z.string(),
  source:     z.string().default(''),
  deadline:   z.string().min(1, 'Укажите срок исполнения'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Выберите товар'),
    qty:       z.number().int().min(1, 'Мин. 1'),
    price:     z.coerce.number().min(0).default(0),
  })).min(1, 'Добавьте хотя бы один товар'),
})
type FormData = z.infer<typeof schema>

function OrderForm({
  initial, onSave, onDelete, onCancel,
}: {
  initial?: Order
  onSave: (d: FormData) => void
  onDelete?: () => void
  onCancel: () => void
}) {
  const { products } = useProductStore()
  const getStock     = useStockStore((s) => s.getStock)
  const { sources }  = useOrderSourceStore()
  const [confirmDel, setConfirmDel] = useState(false)

  const activeSources = sources.filter((s) => !s.archived)

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientName: initial?.clientName ?? '',
      phone:      initial?.phone      ?? '',
      address:    initial?.address    ?? '',
      comment:    initial?.comment    ?? '',
      source:     initial?.source     ?? '',
      deadline:   initial?.deadline ? toDatetimeLocal(initial.deadline) : '',
      items:      initial?.items.map((i) => ({ productId: i.productId, qty: i.qty, price: i.price ?? 0 })) ?? [{ productId: '', qty: 1, price: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchItems  = watch('items')
  const watchSource = watch('source')
  const liveTotal   = calcTotal((watchItems ?? []).map((it) => ({ productId: it.productId, qty: Number(it.qty) || 0, price: Number(it.price) || 0 })))

  return (
    <form onSubmit={handleSubmit(onSave)} style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Client */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="m-label">Клиент</p>
        <input
          {...register('clientName')}
          placeholder="Имя клиента / Организация"
          className="input-field"
        />
        {errors.clientName && <ErrMsg msg={errors.clientName.message!} />}

        <div className="relative">
          <Phone size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                className="input-field pl-9"
                style={{ borderColor: errors.phone ? 'var(--danger-border)' : undefined }}
              />
            )}
          />
        </div>
        {errors.phone && <ErrMsg msg={errors.phone.message!} />}

        <div className="relative">
          <MapPin size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input {...register('address')} placeholder="Адрес доставки" className="input-field pl-9" />
        </div>
        {errors.address && <ErrMsg msg={errors.address.message!} />}

        <div className="relative">
          <Note size={14} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <textarea {...register('comment')} rows={2} placeholder="Комментарий…"
            className="input-field pl-9 resize-none w-full" />
        </div>

        {/* Источник заказа */}
        <div>
          <p className="m-label" style={{ marginBottom: 6 }}>Источник заказа</p>
          <SearchSelect
            value={watchSource ?? ''}
            onChange={(v) => setValue('source', v)}
            options={[
              { value: '', label: '— не указан —' },
              ...activeSources.map((s) => ({ value: s.id, label: s.name })),
            ]}
            placeholder="— не указан —"
            style={{ height: 40 }}
          />
        </div>

        {/* Срок исполнения */}
        <div>
          <p className="m-label" style={{ marginBottom: 6 }}>Срок исполнения</p>
          <Controller
            name="deadline"
            control={control}
            render={({ field }) => (
              <DateTimePickerMobile
                value={field.value}
                onChange={field.onChange}
                placeholder="Выберите дату и время"
                hasError={!!errors.deadline}
              />
            )}
          />
          {errors.deadline && <ErrMsg msg={errors.deadline.message!} />}
        </div>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p className="m-label">Товары</p>
        {errors.items?.root && <ErrMsg msg={errors.items.root.message!} />}

        {fields.map((field, i) => {
          const pid    = watchItems[i]?.productId
          const prod   = products.find((p) => p.id === pid)
          const stock  = pid ? getStock(pid) : 0
          const qty    = watchItems[i]?.qty ?? 0
          const warn   = pid && qty > stock

          return (
            <div key={field.id} style={{
              padding: 12, borderRadius: 'var(--radius-xl)',
              border: `1px solid ${warn ? 'var(--danger-border)' : 'var(--border-subtle)'}`,
              background: warn ? 'var(--danger-bg)' : 'var(--surface-sunken)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {prod && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    <ProductAvatar photo={prod.photo} name={prod.name} className="w-full h-full" />
                  </div>
                )}
                <input type="hidden" {...register(`items.${i}.productId`)} />
                <div style={{ flex: 1 }}>
                  <SearchSelect
                    value={watchItems[i]?.productId ?? ''}
                    onChange={(v) => setValue(`items.${i}.productId`, v, { shouldValidate: true })}
                    options={[
                      { value: '', label: '— выберите товар —' },
                      ...products.map((p) => ({
                        value: p.id,
                        label: `${p.name} ${p.size} ${p.color}`,
                        subLabel: `${p.article} · ост: ${getStock(p.id)} шт`,
                      })),
                    ]}
                    placeholder="— выберите товар —"
                    style={{ height: 36 }}
                  />
                </div>
                <button type="button" onClick={() => remove(i)}
                  style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                  <Trash size={14} />
                </button>
              </div>

              {pid && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Кол-во:</span>
                    <Controller
                      name={`items.${i}.qty`}
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          value={field.value ?? 1}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          min={1}
                          style={{
                            width: 80, background: 'var(--surface-card)', border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)', padding: '4px 8px',
                            fontSize: 'var(--text-sm)', textAlign: 'center', color: 'var(--text-primary)', outline: 'none',
                            fontFamily: 'var(--font-sans)',
                          }}
                        />
                      )}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>шт</span>
                    {warn && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--danger-fg)', marginLeft: 'auto' }}>
                        <WarningCircle size={11} weight="fill" />
                        мало ({stock} шт)
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Цена, UZS:</span>
                    <Controller
                      name={`items.${i}.price`}
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          value={field.value ?? 0}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          min={0}
                          placeholder="0"
                          style={{
                            width: 112, background: 'var(--surface-card)', border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)', padding: '4px 8px',
                            fontSize: 'var(--text-sm)', textAlign: 'right', color: 'var(--text-primary)', outline: 'none',
                            fontFamily: 'var(--font-sans)',
                          }}
                        />
                      )}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>за шт</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => append({ productId: '', qty: 1, price: 0 })}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 'var(--radius-xl)',
            border: '1px dashed var(--border-default)', background: 'none',
            fontSize: 12, color: 'var(--text-tertiary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Plus size={12} weight="bold" /> Добавить товар
        </button>
      </div>

      {/* Total */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: 'var(--radius-xl)', padding: '12px 16px',
        background: liveTotal > 0 ? 'var(--success-bg)' : 'var(--surface-sunken)',
        border: `1px solid ${liveTotal > 0 ? 'var(--success-border)' : 'var(--border-subtle)'}`,
      }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Сумма заказа</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700,
          color: liveTotal > 0 ? 'var(--success-fg)' : 'var(--text-disabled)',
        }}>
          {liveTotal > 0 ? formatUZS(liveTotal) : '—'}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
        <button type="button" onClick={onCancel} style={{
          flex: 1, padding: '12px 0', borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-default)', background: 'none',
          fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', cursor: 'pointer',
        }}>
          Отмена
        </button>
        <button type="submit" style={{
          flex: 1, padding: '12px 0', borderRadius: 'var(--radius-xl)',
          border: 'none', background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)',
          fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
        }}>
          {initial ? 'Сохранить' : 'Создать заказ'}
        </button>
      </div>

      {onDelete && (
        !confirmDel ? (
          <button type="button" onClick={() => setConfirmDel(true)} style={{
            width: '100%', padding: '10px 0', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--danger-fg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            borderRadius: 'var(--radius-xl)',
          }}>
            <Trash size={14} /> Удалить заказ
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setConfirmDel(false)} style={{
              flex: 1, padding: '10px 0', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)', background: 'none',
              fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', cursor: 'pointer',
            }}>Отмена</button>
            <button type="button" onClick={onDelete} style={{
              flex: 1, padding: '10px 0', borderRadius: 'var(--radius-xl)',
              border: 'none', background: 'var(--danger-solid)', color: '#fff',
              fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
            }}>Удалить</button>
          </div>
        )
      )}
    </form>
  )
}

function ErrMsg({ msg }: { msg: string }) {
  return (
    <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--danger-fg)', margin: '-4px 0 0' }}>
      <WarningCircle size={11} weight="fill" />{msg}
    </p>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIST VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function OrderCard({ order, onTap }: { order: Order; onTap: () => void }) {
  const st       = STATUS_META[order.status]
  const { products } = useProductStore()
  const totalQty = order.items.reduce((s, i) => s + i.qty, 0)
  const date     = new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

  return (
    <div
      onClick={onTap}
      className="m-card"
      style={{ padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, transition: 'box-shadow var(--dur-fast), transform var(--dur-fast)' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{order.num}</span>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 6, ...st.chip }}>
              {st.label}
            </span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.clientName}
          </p>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 2 }}>{date}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
        <Phone size={11} /><span>{order.phone}</span>
      </div>
      {order.address && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
          <MapPin size={11} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.address}</span>
        </div>
      )}

      {/* Items preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex' }}>
          {order.items.slice(0, 3).map((item) => {
            const p = products.find((pr) => pr.id === item.productId)
            return p ? (
              <div key={item.productId} style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--surface-card)', marginLeft: -4 }}>
                <ProductAvatar photo={p.photo} name={p.name} className="w-full h-full" />
              </div>
            ) : null
          })}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{totalQty} шт · {order.items.length} позиц.</span>
        {order.totalAmount ? (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--success-fg)' }}>
            {formatUZS(order.totalAmount)}
          </span>
        ) : null}
      </div>

      {/* Deadline badge */}
      {order.deadline && (() => {
        const ds = getDeadlineStatus(order.deadline)
        const deadlineStyle = ds === 'overdue'
          ? { background: 'var(--danger-bg)', color: 'var(--danger-fg)', border: '1px solid var(--danger-border)' }
          : ds === 'urgent'
          ? { background: 'var(--warning-bg)', color: 'var(--warning-fg)', border: '1px solid var(--warning-border)' }
          : { background: 'var(--surface-sunken)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }
        return (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 500, padding: '4px 8px',
            borderRadius: 'var(--radius-lg)', width: 'fit-content',
            ...deadlineStyle,
          }}>
            <span>{ds === 'overdue' ? '⚠' : ds === 'urgent' ? '⏰' : '📅'}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{formatDeadline(order.deadline)}</span>
          </div>
        )
      })()}
    </div>
  )
}

function ListView({
  onEdit,
}: { onEdit: (o: Order) => void }) {
  const { orders } = useOrderStore()
  const [query,  setQuery]  = useState('')
  const [tab,    setTab]    = useState<OrderStatus | 'ALL'>('ALL')

  const visible = orders.filter((o) => {
    if (tab !== 'ALL' && o.status !== tab) return false
    if (query) {
      const q = query.toLowerCase()
      if (!`${o.clientName} ${o.num} ${o.phone}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  const counts = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 16px 8px' }}>
      <SearchBar value={query} onChange={setQuery} placeholder="Поиск заказа…" />

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {([['ALL', 'Все', orders.length], ...STATUS_ORDER.map((s) => [s, STATUS_META[s].label, counts[s]])] as [string, string, number][]).map(([key, label, cnt]) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 'var(--radius-lg)',
              border: `1px solid ${tab === key ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
              background: tab === key ? 'var(--accent)' : 'var(--surface-sunken)',
              color: tab === key ? 'var(--text-on-accent)' : 'var(--text-tertiary)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'all var(--dur-fast)',
            }}
          >
            {label}
            {cnt > 0 && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 999,
                background: tab === key ? 'rgba(255,255,255,0.2)' : 'var(--border-default)',
                color: tab === key ? 'var(--text-on-accent)' : 'var(--text-tertiary)',
              }}>{cnt}</span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {visible.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visible.map((o) => <OrderCard key={o.id} order={o} onTap={() => onEdit(o)} />)}
        </div>
      ) : (
        <EmptyState icon={<Note size={44} weight="thin" />} title="Нет заказов" subtitle="Создайте первый заказ" />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// KANBAN VIEW — pointer-events-based drag & drop
// ═══════════════════════════════════════════════════════════════════════════════

type DragState = {
  orderId: string
  ghost: HTMLElement
  offsetX: number
  offsetY: number
  activeCol: string | null
}

function KanbanCardEl({
  order,
  onEdit,
  onDragStart,
}: {
  order: Order
  onEdit: () => void
  onDragStart: (e: React.PointerEvent, orderId: string) => void
}) {
  const totalQty = order.items.reduce((s, i) => s + i.qty, 0)

  return (
    <div
      data-order-id={order.id}
      className="m-card"
      style={{
        padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
        touchAction: 'none', userSelect: 'none', cursor: 'grab', borderRadius: 'var(--radius-xl)',
      }}
      onClick={onEdit}
      onPointerDown={(e) => {
        e.stopPropagation()
        onDragStart(e, order.id)
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{order.num}</span>
        <DotsSixVertical size={14} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>{order.clientName}</p>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>{totalQty} шт · {order.items.length} позиц.</p>
      {order.deadline && (() => {
        const ds = getDeadlineStatus(order.deadline)
        const deadlineStyle = ds === 'overdue'
          ? { background: 'var(--danger-bg)', color: 'var(--danger-fg)' }
          : ds === 'urgent'
          ? { background: 'var(--warning-bg)', color: 'var(--warning-fg)' }
          : { background: 'var(--surface-sunken)', color: 'var(--text-tertiary)' }
        return (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 500, padding: '2px 6px',
            borderRadius: 6, width: 'fit-content', ...deadlineStyle,
          }}>
            {ds === 'overdue' ? '⚠' : ds === 'urgent' ? '⏰' : '📅'} {formatDeadline(order.deadline)}
          </div>
        )
      })()}
    </div>
  )
}

function KanbanView({ onEdit }: { onEdit: (o: Order) => void }) {
  const { orders, setStatus } = useOrderStore()
  const drag = useRef<DragState | null>(null)
  const [activeCol, setActiveCol] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback((e: React.PointerEvent, orderId: string) => {
    const card  = e.currentTarget as HTMLElement
    const rect  = card.getBoundingClientRect()
    const ghost = card.cloneNode(true) as HTMLElement

    Object.assign(ghost.style, {
      position:    'fixed',
      top:         `${rect.top}px`,
      left:        `${rect.left}px`,
      width:       `${rect.width}px`,
      zIndex:      '9999',
      opacity:     '0.9',
      transform:   'rotate(2deg) scale(1.04)',
      pointerEvents: 'none',
      transition:  'transform 0.1s ease',
      boxShadow:   '0 20px 40px rgba(0,0,0,0.5)',
    })
    document.body.appendChild(ghost)

    card.style.opacity = '0.3'

    drag.current = {
      orderId,
      ghost,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      activeCol: null,
    }

    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return
    const { ghost, offsetX, offsetY } = drag.current

    ghost.style.top  = `${e.clientY - offsetY}px`
    ghost.style.left = `${e.clientX - offsetX}px`

    // Find which column is under pointer (hide ghost temporarily)
    ghost.style.display = 'none'
    const el  = document.elementFromPoint(e.clientX, e.clientY)
    ghost.style.display = ''
    const col = el?.closest('[data-kanban-col]')?.getAttribute('data-kanban-col') ?? null
    drag.current.activeCol = col
    setActiveCol(col)
  }, [])

  const handlePointerUp = useCallback((_e: React.PointerEvent) => {
    if (!drag.current) return
    const { orderId, ghost, activeCol: col } = drag.current

    ghost.remove()

    // Restore original card opacity
    const orig = document.querySelector(`[data-order-id="${orderId}"]`) as HTMLElement | null
    if (orig) orig.style.opacity = ''

    if (col) {
      const order     = orders.find((o) => o.id === orderId)
      const newStatus = col as OrderStatus

      if (order && order.status !== newStatus) {
        setStatus(orderId, newStatus)
      }
    }

    drag.current = null
    setActiveCol(null)
  }, [orders, setStatus])

  return (
    <div
      ref={boardRef}
      className="flex gap-3 overflow-x-auto pb-4 px-4 pt-4 h-[calc(100dvh-140px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {STATUS_ORDER.map((status) => {
        const colOrders = orders.filter((o) => o.status === status)
        const meta      = STATUS_META[status]
        const isActive  = activeCol === status

        return (
          <div
            key={status}
            data-kanban-col={status}
            style={{
              flexShrink: 0, width: 256, display: 'flex', flexDirection: 'column',
              borderRadius: 'var(--radius-2xl)', border: `1px solid ${isActive ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
              background: isActive ? 'var(--accent-soft)' : 'var(--surface-card)',
              boxShadow: isActive ? '0 0 20px rgba(255,237,0,0.10)' : 'var(--shadow-xs)',
              transition: 'all var(--dur-fast)',
            }}
          >
            {/* Column header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: meta.dot }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{meta.label}</span>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)',
                background: 'var(--surface-sunken)', padding: '2px 6px', borderRadius: 6,
              }}>
                {colOrders.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'none' }}>
              {colOrders.map((o) => (
                <KanbanCardEl
                  key={o.id}
                  order={o}
                  onEdit={() => onEdit(o)}
                  onDragStart={handleDragStart}
                />
              ))}
              {colOrders.length === 0 && (
                <div style={{
                  height: 64, borderRadius: 'var(--radius-xl)',
                  border: `2px dashed ${isActive ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                  background: isActive ? 'var(--accent-soft)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>
                    {isActive ? 'Отпустите здесь' : 'Пусто'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

type ViewMode = 'list' | 'kanban'
type SheetState = { type: 'none' } | { type: 'create' } | { type: 'edit'; order: Order }

export function OrdersPage() {
  const { orders, createOrder, updateOrder, removeOrder, fetch: fetchOrders } = useOrderStore()
  const { fetch: fetchProducts } = useProductStore()
  const { fetchStock } = useStockStore()
  const { fetch: fetchSources } = useOrderSourceStore()
  const [view,  setView]  = useState<ViewMode>('list')
  const [sheet, setSheet] = useState<SheetState>({ type: 'none' })

  useEffect(() => {
    fetchOrders()
    fetchProducts()
    fetchStock()
    fetchSources()
  }, [])

  async function handleSave(data: FormData) {
    const deadlineISO = data.deadline ? new Date(data.deadline).toISOString() : undefined
    const payload = { ...data, source: data.source || undefined, deadline: deadlineISO }
    if (sheet.type === 'create') {
      await createOrder(payload as Parameters<typeof createOrder>[0])
    } else if (sheet.type === 'edit') {
      await updateOrder(sheet.order.id, payload as Parameters<typeof updateOrder>[1])
    }
    setSheet({ type: 'none' })
  }

  async function handleDelete() {
    if (sheet.type === 'edit') {
      await removeOrder(sheet.order.id)
      setSheet({ type: 'none' })
    }
  }

  return (
    <div style={{ minHeight: '100dvh' }}>
      <PageHeader
        title={`Заказы · ${orders.length}`}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* View toggle */}
            <div style={{
              display: 'flex', background: 'var(--surface-sunken)',
              border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 2,
            }}>
              {([['list', List], ['kanban', Kanban]] as [ViewMode, React.ElementType][]).map(([mode, Icon]) => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  style={{
                    padding: 6, borderRadius: 'var(--radius-md)',
                    border: 'none', cursor: 'pointer',
                    background: view === mode ? 'var(--accent)' : 'transparent',
                    color: view === mode ? 'var(--text-on-accent)' : 'var(--text-tertiary)',
                    transition: 'all var(--dur-fast)',
                  }}
                >
                  <Icon size={15} weight={view === mode ? 'fill' : 'regular'} />
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Content */}
      <div style={{ paddingBottom: 104 }}>
        {view === 'list'
          ? <ListView onEdit={(o) => setSheet({ type: 'edit', order: o })} />
          : <KanbanView onEdit={(o) => setSheet({ type: 'edit', order: o })} />}
      </div>

      {/* FAB */}
      <button
        onClick={() => setSheet({ type: 'create' })}
        style={{
          position: 'fixed', bottom: 88, right: 16, zIndex: 30,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(255,237,0,0.35)',
        }}
        aria-label="Новый заказ"
      >
        <Plus size={24} weight="bold" />
      </button>

      {/* Order form sheet */}
      <BottomSheet
        open={sheet.type !== 'none'}
        onClose={() => setSheet({ type: 'none' })}
        title={sheet.type === 'create' ? 'Новый заказ' : `Заказ ${sheet.type === 'edit' ? sheet.order.num : ''}`}
        tall
      >
        {sheet.type !== 'none' && (
          <OrderForm
            initial={sheet.type === 'edit' ? sheet.order : undefined}
            onSave={handleSave}
            onDelete={sheet.type === 'edit' ? handleDelete : undefined}
            onCancel={() => setSheet({ type: 'none' })}
          />
        )}
      </BottomSheet>
    </div>
  )
}
