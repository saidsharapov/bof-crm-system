/**
 * MovementPage — Приход / Расход.
 * Desktop: full-page DS form (light, white card).
 * Mobile: original dark step-by-step UI.
 */
import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowDown, ArrowUp, MagnifyingGlass,
  WarningCircle, CheckCircle, Package,
} from '@phosphor-icons/react'
import { useProductStore } from '@/store/productStore'
import { useStockStore }   from '@/store/stockStore'
import { useAuthStore }    from '@/store/authStore'
import { ProductAvatar }   from '@/components/products/ProductAvatar'
import { PageHeader }      from '@/components/ui/PageHeader'
import { useIsDesktop }    from '@/hooks/useIsDesktop'
import { SearchSelect }    from '@/components/ui/SearchSelect'
import { NumberInput }     from '@/components/ui/NumberInput'

// ── Schema ────────────────────────────────────────────────────────────────────
function makeSchema(type: 'IN' | 'OUT', available: number) {
  return z.object({
    productId: z.string().min(1, 'Выберите товар'),
    qty: z
      .number({ invalid_type_error: 'Введите число' })
      .int('Только целые числа')
      .min(1, 'Минимум 1 штука')
      .max(
        type === 'OUT' ? available : 999_999,
        type === 'OUT'
          ? `Недостаточно остатка. Доступно: ${available} шт`
          : 'Слишком большое значение',
      ),
    comment: z.string().max(300),
  })
}
type FormData = { productId: string; qty: number; comment: string }

// ── Mobile: product picker ────────────────────────────────────────────────────
function ProductPicker({ selected, onSelect, getStock, type }: {
  selected: string; onSelect: (id: string) => void
  getStock: (id: string) => number; type: 'IN' | 'OUT'
}) {
  const { products } = useProductStore()
  const [q, setQ] = useState('')
  const visible = useMemo(() => {
    const lq = q.toLowerCase()
    return products.filter((p) => !lq || `${p.name} ${p.article} ${p.color}`.toLowerCase().includes(lq))
  }, [products, q])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ position: 'relative' }}>
        <MagnifyingGlass size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
        <input type="search" placeholder="Поиск товара…" value={q} onChange={(e) => setQ(e.target.value)}
          className="input-field" style={{ paddingLeft: 34 }} />
      </div>
      <div style={{ maxHeight: 256, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, scrollbarWidth: 'none' }}>
        {visible.map((p) => {
          const stock = getStock(p.id)
          const isSelected = p.id === selected
          const noStock = type === 'OUT' && stock === 0
          const stockColor = stock === 0 ? 'var(--danger-fg)' : stock < 10 ? 'var(--warning-fg)' : 'var(--success-fg)'
          return (
            <button key={p.id} type="button" disabled={noStock} onClick={() => onSelect(p.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 'var(--radius-xl)', textAlign: 'left',
                border: `1px solid ${isSelected ? 'rgba(91,110,245,0.3)' : 'transparent'}`,
                background: isSelected ? 'rgba(91,110,245,0.1)' : 'none',
                cursor: noStock ? 'not-allowed' : 'pointer', opacity: noStock ? 0.4 : 1,
                transition: 'all var(--dur-fast)',
              }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                <ProductAvatar photo={p.photo} name={p.name} className="w-full h-full" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                  {p.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.colorHex, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{p.color} · {p.size}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: stockColor, margin: 0 }}>{stock}</p>
                <p style={{ fontSize: 9, color: 'var(--text-disabled)', margin: 0 }}>шт</p>
              </div>
            </button>
          )
        })}
        {visible.length === 0 && (
          <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>
            Ничего не найдено
          </p>
        )}
      </div>
    </div>
  )
}

// ── Success overlay (mobile) ──────────────────────────────────────────────────
function SuccessOverlay({ type, qty, name, onDone }: {
  type: 'IN' | 'OUT'; qty: number; name: string; onDone: () => void
}) {
  const isIN = type === 'IN'
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-canvas)', padding: '0 32px', textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: isIN ? 'var(--success-bg)' : 'var(--danger-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
      }}>
        <CheckCircle size={44} weight="fill" style={{ color: isIN ? 'var(--success-fg)' : 'var(--danger-fg)' }} />
      </div>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>
        {isIN ? 'Приход оформлен!' : 'Расход оформлен!'}
      </h2>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
        {isIN ? '+' : '−'}{qty} шт · {name}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, marginBottom: 0 }}>
        Остаток автоматически обновлён
      </p>
      <button onClick={onDone} style={{
        marginTop: 40, padding: '14px 32px', borderRadius: 'var(--radius-2xl)',
        border: 'none', background: '#5b6ef5', color: '#fff',
        fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
      }}>
        Готово
      </button>
    </div>
  )
}

// ── Desktop success banner ────────────────────────────────────────────────────
function DesktopSuccessBanner({ type, qty, name, onDone }: {
  type: 'IN' | 'OUT'; qty: number; name: string; onDone: () => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '18px 24px',
      background: 'var(--success-bg)',
      border: '1px solid var(--success-border)',
      borderRadius: 'var(--radius-2xl)',
      marginBottom: 20,
    }} className="animate-fade-in">
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CheckCircle size={24} weight="fill" style={{ color: 'var(--success-fg)' }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--success-fg)', margin: 0 }}>
          {type === 'IN' ? 'Приход оформлен' : 'Расход оформлен'}
        </p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--success-fg)', opacity: 0.7, margin: '2px 0 0' }}>
          {type === 'IN' ? '+' : '−'}{qty} шт · {name} · Остаток обновлён
        </p>
      </div>
      <button onClick={onDone} style={{
        padding: '8px 18px', borderRadius: 'var(--radius-lg)',
        border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)', fontWeight: 600,
        background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)',
      }}>
        Ещё одна операция
      </button>
    </div>
  )
}

// ── Desktop field label ───────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
      letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>
      {children}
      {required && <span style={{ color: 'var(--danger-fg)', marginLeft: 3 }}>*</span>}
    </label>
  )
}

// ── Desktop form ──────────────────────────────────────────────────────────────
function DesktopMovementForm({ type, onSuccess, onBack }: {
  type: 'IN' | 'OUT'; onSuccess: (qty: number, name: string) => void; onBack: () => void
}) {
  const { products } = useProductStore()
  const { getStock, addMovement } = useStockStore()
  const { user } = useAuthStore()

  const [selectedId, setSelectedId] = useState('')
  const available = selectedId ? getStock(selectedId) : 0
  const schema = useMemo(() => makeSchema(type, available), [type, available])

  const { register, handleSubmit, setValue, reset, watch, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { productId: '', qty: undefined as unknown as number, comment: '' },
  })

  const watchedProduct = watch('productId')
  const selectedProduct = products.find((p) => p.id === watchedProduct)
  const stockAfter = selectedId
    ? (type === 'IN' ? available + (watch('qty') || 0) : available - (watch('qty') || 0))
    : null

  function onSelectProduct(id: string) {
    setSelectedId(id)
    setValue('productId', id, { shouldValidate: true })
  }

  function onSubmit(data: FormData) {
    addMovement(data.productId, type, data.qty, data.comment, user?.name ?? 'Пользователь')
    const pName = products.find((p) => p.id === data.productId)?.name ?? ''
    onSuccess(data.qty, pName)
    reset()
    setSelectedId('')
  }

  const isIN = type === 'IN'
  const accentColor = isIN ? 'var(--success-fg)' : 'var(--danger-fg)'
  const accentBg    = isIN ? 'var(--success-bg)' : 'var(--danger-bg)'
  const accentBd    = isIN ? 'var(--success-border)' : 'var(--danger-border)'

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 40, padding: '0 12px',
    background: 'var(--surface-sunken)',
    border: '1px solid var(--border-default)',
    borderRadius: 10, fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
    outline: 'none', boxSizing: 'border-box',
  }
  const textareaStyle: React.CSSProperties = {
    ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'none',
  }
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Тип операции */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '5px 12px', borderRadius: 'var(--radius-full)',
          background: accentBg, border: `1px solid ${accentBd}`,
          fontSize: 'var(--text-xs)', fontWeight: 700,
          color: accentColor, letterSpacing: 'var(--tracking-caps)',
          textTransform: 'uppercase', alignSelf: 'flex-start',
        }}>
          {isIN ? <ArrowDown size={12} weight="bold" /> : <ArrowUp size={12} weight="bold" />}
          {isIN ? 'Приход' : 'Расход'}
        </div>

        {/* Товар */}
        <div>
          <FieldLabel required>Товар / материал</FieldLabel>
          <input type="hidden" {...register('productId')} />
          <SearchSelect
            value={selectedId}
            onChange={onSelectProduct}
            options={[
              { value: '', label: '— выберите товар —' },
              ...products.map((p) => {
                const s = getStock(p.id)
                return {
                  value: p.id,
                  label: `${p.name} (${p.size}, ${p.color})`,
                  subLabel: `${p.article} · ${s} шт на складе`,
                  disabled: type === 'OUT' && s === 0,
                }
              }),
            ]}
            placeholder="— выберите товар —"
            hasError={!!errors.productId}
            style={{ ...inputStyle, height: 40, cursor: 'pointer' }}
          />
          {errors.productId && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-fg)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <WarningCircle size={12} weight="fill" /> {errors.productId.message}
            </p>
          )}

          {/* Остаток выбранного товара */}
          {selectedProduct && (
            <div style={{
              marginTop: 10, padding: '10px 14px',
              background: available === 0 ? 'var(--danger-bg)' : available < 10 ? 'var(--warning-bg)' : 'var(--success-bg)',
              border: `1px solid ${available === 0 ? 'var(--danger-border)' : available < 10 ? 'var(--warning-border)' : 'var(--success-border)'}`,
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{selectedProduct.name}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>{selectedProduct.article} · {selectedProduct.color} · {selectedProduct.size}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-lg)',
                  color: available === 0 ? 'var(--danger-fg)' : available < 10 ? 'var(--warning-fg)' : 'var(--success-fg)', margin: 0 }}>
                  {available} шт
                </p>
                <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: '1px 0 0' }}>на складе</p>
              </div>
            </div>
          )}
        </div>

        {/* Количество + быстрые кнопки */}
        {selectedProduct && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
              <div>
                <FieldLabel required>Количество (шт)</FieldLabel>
                <Controller
                  name="qty"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      value={field.value ?? 0}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      min={1}
                      max={type === 'OUT' ? available : undefined}
                      placeholder="0"
                      disabled={type === 'OUT' && available === 0}
                      style={{ ...inputStyle, borderColor: errors.qty ? 'var(--danger-border)' : undefined }}
                    />
                  )}
                />
              </div>
              <div>
                <FieldLabel>Ед.</FieldLabel>
                <select style={{ ...selectStyle, width: 80 }}>
                  <option>шт</option>
                </select>
              </div>
            </div>

            {/* Остаток после */}
            {stockAfter !== null && (watch('qty') || 0) > 0 && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                <span>Остаток после:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: (type === 'OUT' && stockAfter! < 0) ? 'var(--danger-fg)' : 'var(--text-primary)' }}>
                  {stockAfter} шт
                </span>
              </div>
            )}

            {errors.qty && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-fg)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <WarningCircle size={12} weight="fill" /> {errors.qty.message}
              </p>
            )}

            {/* Быстрые кнопки */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {[5, 10, 20, 50, 100].map((n) => (
                <button key={n} type="button"
                  disabled={type === 'OUT' && n > available}
                  onClick={() => setValue('qty', n, { shouldValidate: true })}
                  style={{
                    flex: 1, height: 32, borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--surface-sunken)',
                    cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600,
                    color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                    opacity: (type === 'OUT' && n > available) ? 0.3 : 1,
                    transition: 'background 0.12s',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Причина (OUT) */}
        {selectedProduct && type === 'OUT' && (
          <div>
            <FieldLabel>Причина</FieldLabel>
            <select style={selectStyle}>
              <option value="ship">Отгрузка по заказу</option>
              <option value="reserve">Резерв</option>
              <option value="defect">Брак / списание</option>
            </select>
          </div>
        )}

        {/* Источник (IN) */}
        {selectedProduct && type === 'IN' && (
          <div>
            <FieldLabel>Источник поступления</FieldLabel>
            <input placeholder="Поставщик, производство…"
              style={inputStyle} />
          </div>
        )}

        {/* Комментарий */}
        {selectedProduct && (
          <div>
            <FieldLabel>Комментарий</FieldLabel>
            <textarea
              {...register('comment')}
              rows={2}
              placeholder={isIN ? 'Источник поступления, накладная…' : 'Назначение, номер заказа…'}
              style={textareaStyle}
            />
          </div>
        )}

        {/* Предупреждение OUT при 0 остатке */}
        {type === 'OUT' && selectedProduct && available === 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <WarningCircle size={16} weight="fill" style={{ color: 'var(--danger-fg)', flexShrink: 0 }} />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--danger-fg)', margin: 0 }}>
              Нет остатка. Расход невозможен.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!selectedProduct && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <Package size={40} style={{ color: 'var(--text-disabled)', margin: '0 auto 10px' }} weight="thin" />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>Выберите товар выше</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" onClick={onBack} style={{
            padding: '9px 20px', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            background: 'transparent', cursor: 'pointer',
            fontSize: 'var(--text-sm)', fontWeight: 500,
            color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)',
          }}>
            Назад
          </button>
          <button type="submit"
            disabled={!selectedProduct || (type === 'OUT' && available === 0)}
            style={{
              padding: '9px 20px', borderRadius: 'var(--radius-lg)',
              border: 'none', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              background: isIN ? 'var(--success-solid)' : 'var(--danger-solid)',
              color: '#fff', fontFamily: 'var(--font-sans)',
              opacity: (!selectedProduct || (type === 'OUT' && available === 0)) ? 0.45 : 1,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
            {isIN ? <ArrowDown size={15} weight="bold" /> : <ArrowUp size={15} weight="bold" />}
            {isIN ? 'Оприходовать' : 'Списать'}
          </button>
        </div>
      </div>
    </form>
  )
}

// ── Desktop layout ────────────────────────────────────────────────────────────
function DesktopMovementPage({ type }: { type: 'IN' | 'OUT' }) {
  const navigate = useNavigate()
  const [success, setSuccess] = useState<{ qty: number; name: string } | null>(null)
  const isIN = type === 'IN'

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      {/* Back */}
      <button
        onClick={() => navigate('/warehouse')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Назад на склад
      </button>

      {success && (
        <DesktopSuccessBanner
          type={type}
          qty={success.qty}
          name={success.name}
          onDone={() => setSuccess(null)}
        />
      )}

      {/* Card */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: isIN ? 'var(--success-bg)' : 'var(--danger-bg)',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isIN ? 'var(--success-border)' : 'var(--danger-border)',
            flexShrink: 0,
          }}>
            {isIN
              ? <ArrowDown size={22} weight="bold" style={{ color: 'var(--success-fg)' }} />
              : <ArrowUp   size={22} weight="bold" style={{ color: 'var(--danger-fg)' }} />}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)' }}>
              {isIN ? 'Приход на склад' : 'Расход со склада'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {isIN ? 'Поступление товара или материала' : 'Списание, отгрузка или резерв'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: 24 }}>
          <DesktopMovementForm
            type={type}
            onSuccess={(qty, name) => setSuccess({ qty, name })}
            onBack={() => navigate('/warehouse')}
          />
        </div>
      </div>
    </div>
  )
}

// ── Mobile layout (unchanged) ─────────────────────────────────────────────────
function MobileMovementPage({ type }: { type: 'IN' | 'OUT' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const params   = new URLSearchParams(location.search)
  const initId   = params.get('productId') ?? ''

  const { products } = useProductStore()
  const { getStock, addMovement } = useStockStore()
  const { user } = useAuthStore()

  const [selectedId,  setSelectedId]  = useState(initId)
  const [showSuccess, setShowSuccess] = useState(false)
  const [doneQty,     setDoneQty]     = useState(0)

  const available = selectedId ? getStock(selectedId) : 0
  const schema    = useMemo(() => makeSchema(type, available), [type, available])

  const { register, handleSubmit, setValue, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { productId: initId, qty: undefined as unknown as number, comment: '' },
  })

  const selectedProduct = products.find((p) => p.id === selectedId)
  const isIN  = type === 'IN'

  function handleSelectProduct(id: string) {
    setSelectedId(id)
    setValue('productId', id, { shouldValidate: true })
  }

  const onSubmit = (data: FormData) => {
    addMovement(data.productId, type, data.qty, data.comment, user?.name ?? 'Пользователь')
    setDoneQty(data.qty)
    setShowSuccess(true)
  }

  function handleDone() {
    setShowSuccess(false)
    reset()
    setSelectedId('')
    navigate('/warehouse')
  }

  if (showSuccess) {
    return <SuccessOverlay type={type} qty={doneQty} name={selectedProduct?.name ?? ''} onDone={handleDone} />
  }

  const accentFg = isIN ? 'var(--success-fg)' : 'var(--danger-fg)'
  const accentBg = isIN ? 'var(--success-bg)' : 'var(--danger-bg)'
  const accentBd = isIN ? 'var(--success-border)' : 'var(--danger-border)'
  const accentSolid = isIN ? 'var(--success-solid)' : 'var(--danger-solid)'

  return (
    <div style={{ minHeight: '100dvh' }}>
      <PageHeader
        title={isIN ? 'Оформить приход' : 'Оформить расход'}
        back
        right={
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 'var(--radius-lg)',
            border: `1px solid ${accentBd}`,
            background: accentBg, color: accentFg,
            fontSize: 11, fontWeight: 600,
          }}>
            {isIN ? <ArrowDown size={12} weight="bold" /> : <ArrowUp size={12} weight="bold" />}
            {isIN ? 'IN' : 'OUT'}
          </div>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '20px 16px', paddingBottom: 104, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <p className="m-label">1. Выберите товар</p>
            {selectedProduct && (
              <button type="button" onClick={() => handleSelectProduct('')}
                style={{ fontSize: 10, color: '#5b6ef5', background: 'none', border: 'none', cursor: 'pointer' }}>
                Изменить
              </button>
            )}
          </div>
          {selectedProduct ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 12,
              borderRadius: 'var(--radius-2xl)', border: `1px solid ${accentBd}`, background: accentBg,
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                <ProductAvatar photo={selectedProduct.photo} name={selectedProduct.name} className="w-full h-full" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedProduct.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', margin: '2px 0 0' }}>
                  {selectedProduct.article}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                  {selectedProduct.color} · {selectedProduct.size}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{
                  fontSize: 18, fontWeight: 700, margin: 0,
                  color: available === 0 ? 'var(--danger-fg)' : available < 10 ? 'var(--warning-fg)' : 'var(--text-primary)',
                }}>
                  {available}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-tertiary)', margin: 0 }}>на складе</p>
              </div>
            </div>
          ) : (
            <div className="m-card" style={{ padding: 16 }}>
              <input type="hidden" {...register('productId')} />
              <ProductPicker selected={selectedId} onSelect={handleSelectProduct} getStock={getStock} type={type} />
              {errors.productId && (
                <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--danger-fg)', margin: '8px 0 0' }}>
                  <WarningCircle size={12} weight="fill" /> {errors.productId.message}
                </p>
              )}
            </div>
          )}
        </section>

        {selectedProduct && (
          <section>
            <p className="m-label" style={{ marginBottom: 12 }}>2. Количество (штук)</p>
            {!isIN && available < 20 && available > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', marginBottom: 12, borderRadius: 'var(--radius-xl)',
                background: 'var(--warning-bg)', border: '1px solid var(--warning-border)',
              }}>
                <WarningCircle size={14} weight="fill" style={{ color: 'var(--warning-fg)', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: 'var(--warning-fg)', margin: 0 }}>Остаток низкий: {available} шт</p>
              </div>
            )}
            {!isIN && available === 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', marginBottom: 12, borderRadius: 'var(--radius-xl)',
                background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
              }}>
                <WarningCircle size={14} weight="fill" style={{ color: 'var(--danger-fg)', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: 'var(--danger-fg)', margin: 0 }}>Нет остатка. Расход невозможен.</p>
              </div>
            )}
            <div style={{ position: 'relative' }}>
              {isIN
                ? <ArrowDown size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--success-fg)', pointerEvents: 'none' }} />
                : <ArrowUp   size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--danger-fg)',  pointerEvents: 'none' }} />}
              <Controller
                name="qty"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    value={field.value ?? 0}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    min={1}
                    max={!isIN ? available : undefined}
                    placeholder="0"
                    disabled={!isIN && available === 0}
                    style={{
                      width: '100%', background: 'var(--surface-sunken)',
                      border: `1px solid ${errors.qty ? 'var(--danger-border)' : 'var(--border-default)'}`,
                      borderRadius: 'var(--radius-xl)', paddingLeft: 40, paddingRight: 16, paddingTop: 16, paddingBottom: 16,
                      fontSize: 24, fontWeight: 700, textAlign: 'center', color: errors.qty ? 'var(--danger-fg)' : 'var(--text-primary)',
                      outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-mono)',
                    }}
                  />
                )}
              />
            </div>
            {errors.qty && (
              <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--danger-fg)', margin: '8px 0 0' }}>
                <WarningCircle size={12} weight="fill" /> {errors.qty.message}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {[5, 10, 20, 50].map((n) => (
                <button key={n} type="button" disabled={!isIN && n > available}
                  onClick={() => setValue('qty', n, { shouldValidate: true })}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border-default)', background: 'var(--surface-sunken)',
                    fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
                    opacity: (!isIN && n > available) ? 0.3 : 1,
                    fontFamily: 'var(--font-mono)',
                  }}>
                  {n}
                </button>
              ))}
            </div>
          </section>
        )}

        {selectedProduct && (
          <section>
            <p className="m-label" style={{ marginBottom: 12 }}>3. Комментарий</p>
            <textarea {...register('comment')} rows={3}
              placeholder={isIN ? 'Источник поступления, поставщик…' : 'Назначение, номер заказа…'}
              className="input-field" style={{ resize: 'none', padding: '12px 14px' }}
            />
          </section>
        )}

        {selectedProduct && (
          <button type="submit" disabled={!isIN && available === 0}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 'var(--radius-2xl)',
              border: 'none', background: accentSolid, color: '#fff',
              fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
              opacity: (!isIN && available === 0) ? 0.4 : 1,
            }}>
            {isIN ? '+ Оформить приход' : '− Оформить расход'}
          </button>
        )}

        {!selectedProduct && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <Package size={40} style={{ color: 'var(--text-disabled)', margin: '0 auto 12px' }} weight="thin" />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>Выберите товар выше</p>
          </div>
        )}
      </form>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function MovementPage() {
  const location  = useLocation()
  const isDesktop = useIsDesktop()
  const type: 'IN' | 'OUT' = location.pathname.includes('receipt') ? 'IN' : 'OUT'

  if (isDesktop) return <DesktopMovementPage type={type} />
  return <MobileMovementPage type={type} />
}
