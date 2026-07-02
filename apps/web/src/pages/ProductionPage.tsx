import { useState, useEffect } from 'react'
import {
  Plus, Minus, Factory, CheckCircle, WarningCircle,
  Trash, Calculator, ArrowRight,
} from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useMaterialStore } from '@/store/materialStore'
import { useProductStore }  from '@/store/productStore'
import { productionApi }    from '@/api/production'
import { ProductAvatar }    from '@/components/products/ProductAvatar'
import { PageHeader }       from '@/components/ui/PageHeader'
import { NumberInput }      from '@/components/ui/NumberInput'

interface MaterialLine { materialId: string; qty: number }
interface ProductLine  { productId:  string; qty: number }

// ── Material row with built-in calculator ─────────────────────────────────────
function MaterialRow({
  line, index, totalUnits, onChange, onRemove, getStock,
}: {
  line:       MaterialLine
  index:      number
  totalUnits: number
  onChange:   (i: number, patch: Partial<MaterialLine>) => void
  onRemove:   (i: number) => void
  getStock:   (id: string) => number
}) {
  const { materials } = useMaterialStore()
  const mat     = materials.find((m) => m.id === line.materialId)
  const stock   = line.materialId ? getStock(line.materialId) : 0
  const tooMany = line.qty > stock

  const [normPerUnit, setNormPerUnit] = useState<number>(1)
  const [calcMode,    setCalcMode]    = useState(false)

  const calcTotal = parseFloat((normPerUnit * totalUnits).toFixed(3))

  function applyCalc() {
    if (calcTotal > 0) onChange(index, { qty: calcTotal })
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      padding: 14, borderRadius: 'var(--radius-xl)',
      border: `1px solid ${tooMany ? 'var(--danger-border)' : 'var(--border-subtle)'}`,
      background: tooMany ? 'var(--danger-bg)' : 'var(--surface-sunken)',
    }}>
      {/* Material selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <select
          value={line.materialId}
          onChange={(e) => onChange(index, { materialId: e.target.value, qty: 1 })}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
            outline: 'none',
          }}
        >
          <option value="">— выберите материал —</option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} (остаток: {getStock(m.id)} {m.unit})
            </option>
          ))}
        </select>
        <button type="button" onClick={() => onRemove(index)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}>
          <Trash size={14} />
        </button>
      </div>

      {line.materialId && (
        <>
          {/* Total qty */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p className="m-label">Итого к списанию ({mat?.unit})</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', flex: 1,
                borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-default)', overflow: 'hidden',
              }}>
                <button type="button"
                  onClick={() => onChange(index, { qty: Math.max(0.1, parseFloat((line.qty - (normPerUnit || 1)).toFixed(3))) })}
                  style={{ padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                  <Minus size={13} weight="bold" />
                </button>
                <NumberInput
                  value={line.qty}
                  onChange={(n) => onChange(index, { qty: n })}
                  min={0}
                  max={stock}
                  decimals
                  style={{
                    flex: 1, background: 'transparent', border: 'none', textAlign: 'center',
                    fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', outline: 'none', padding: '10px 0',
                  }}
                />
                <button type="button"
                  onClick={() => onChange(index, { qty: parseFloat((line.qty + (normPerUnit || 1)).toFixed(3)) })}
                  style={{ padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                  <Plus size={13} weight="bold" />
                </button>
              </div>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', flexShrink: 0 }}>{mat?.unit}</span>

              {/* Calculator toggle */}
              <button type="button" onClick={() => setCalcMode((p) => !p)} title="Калькулятор нормы"
                style={{
                  padding: 8, borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${calcMode ? 'var(--accent-border)' : 'var(--border-default)'}`,
                  background: calcMode ? 'var(--accent-soft)' : 'none',
                  color: calcMode ? 'var(--accent-text)' : 'var(--text-tertiary)',
                  cursor: 'pointer', flexShrink: 0,
                }}>
                <Calculator size={15} />
              </button>
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
              На складе:{' '}
              <span style={{ color: tooMany ? 'var(--danger-fg)' : 'var(--text-secondary)', fontWeight: tooMany ? 600 : 400 }}>
                {stock} {mat?.unit}
              </span>
              {!tooMany && line.qty > 0 && (
                <span style={{ marginLeft: 8, color: 'var(--text-disabled)' }}>
                  → останется {parseFloat((stock - line.qty).toFixed(3))} {mat?.unit}
                </span>
              )}
            </p>
          </div>

          {/* Calculator panel */}
          {calcMode && (
            <div style={{
              background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
              borderRadius: 'var(--radius-xl)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <p className="m-label" style={{ color: 'var(--accent-text)' }}>Калькулятор расхода</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>На 1 изделие</span>
                  <NumberInput
                    value={normPerUnit}
                    onChange={(n) => setNormPerUnit(n)}
                    min={0}
                    decimals
                    style={{
                      width: '100%', background: 'var(--surface-sunken)', border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)', padding: '8px 10px', fontSize: 'var(--text-sm)',
                      fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 9, color: 'var(--text-disabled)', textAlign: 'center' }}>{mat?.unit}/изд.</span>
                </div>

                <ArrowRight size={14} style={{ color: 'var(--text-disabled)', flexShrink: 0, marginTop: 16 }} />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Кол-во изделий</span>
                  <input type="number" readOnly value={totalUnits || 0}
                    style={{
                      width: '100%', background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)', padding: '8px 10px', fontSize: 'var(--text-sm)',
                      fontWeight: 600, color: 'var(--text-disabled)', textAlign: 'center', outline: 'none', cursor: 'not-allowed',
                    }}
                  />
                  <span style={{ fontSize: 9, color: 'var(--text-disabled)', textAlign: 'center' }}>из блока ↓</span>
                </div>

                <ArrowRight size={14} style={{ color: 'var(--text-disabled)', flexShrink: 0, marginTop: 16 }} />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Итого</span>
                  <div style={{
                    background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
                    borderRadius: 'var(--radius-md)', padding: '8px 10px',
                    fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent-text)', textAlign: 'center',
                  }}>
                    {calcTotal}
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-disabled)', textAlign: 'center' }}>{mat?.unit}</span>
                </div>
              </div>

              <button type="button" onClick={applyCalc} disabled={calcTotal <= 0 || totalUnits === 0}
                style={{
                  width: '100%', padding: '8px 0', borderRadius: 'var(--radius-lg)',
                  border: 'none', background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  opacity: (calcTotal <= 0 || totalUnits === 0) ? 0.4 : 1,
                }}>
                Подставить {calcTotal} {mat?.unit} → в поле списания
              </button>

              {totalUnits === 0 && (
                <p style={{ fontSize: 10, color: 'var(--warning-fg)', textAlign: 'center', margin: 0 }}>
                  Сначала укажите кол-во изделий в блоке «Выпуск продукции» ↓
                </p>
              )}
            </div>
          )}

          {/* Stock error */}
          {tooMany && (
            <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--danger-fg)', margin: 0 }}>
              <WarningCircle size={11} weight="fill" />
              Недостаточно материала. В наличии {stock} {mat?.unit}
            </p>
          )}
        </>
      )}
    </div>
  )
}

// ── Product row ────────────────────────────────────────────────────────────────
function ProductRow({
  line, index, onChange, onRemove,
}: {
  line:     ProductLine
  index:    number
  onChange: (i: number, patch: Partial<ProductLine>) => void
  onRemove: (i: number) => void
}) {
  const { products } = useProductStore()
  const prod = products.find((p) => p.id === line.productId)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      padding: 14, borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border-subtle)', background: 'var(--surface-sunken)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {prod && (
          <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
            <ProductAvatar photo={prod.photo} name={prod.name} className="w-full h-full" />
          </div>
        )}
        <select
          value={line.productId}
          onChange={(e) => onChange(index, { productId: e.target.value, qty: 1 })}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            fontSize: 'var(--text-sm)', color: 'var(--text-primary)', outline: 'none',
          }}
        >
          <option value="">— выберите товар —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} {p.size} {p.color}</option>
          ))}
        </select>
        <button type="button" onClick={() => onRemove(index)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}>
          <Trash size={14} />
        </button>
      </div>

      {line.productId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p className="m-label">Количество (шт)</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', flex: 1,
              borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-default)', overflow: 'hidden',
            }}>
              <button type="button" onClick={() => onChange(index, { qty: Math.max(1, line.qty - 1) })}
                style={{ padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                <Minus size={13} weight="bold" />
              </button>
              <NumberInput
                value={line.qty}
                onChange={(n) => onChange(index, { qty: n })}
                min={1}
                style={{
                  flex: 1, background: 'transparent', border: 'none', textAlign: 'center',
                  fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', outline: 'none', padding: '10px 0',
                }}
              />
              <button type="button" onClick={() => onChange(index, { qty: line.qty + 1 })}
                style={{ padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                <Plus size={13} weight="bold" />
              </button>
            </div>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', flexShrink: 0 }}>шт</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ onDone }: { onDone: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-canvas)', padding: '0 32px', textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'var(--success-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
      }}>
        <CheckCircle size={44} weight="fill" style={{ color: 'var(--success-fg)' }} />
      </div>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>
        Производство завершено
      </h2>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>
        Остатки материалов и товаров обновлены
      </p>
      <button onClick={onDone} style={{
        marginTop: 40, padding: '14px 32px', borderRadius: 'var(--radius-2xl)',
        border: 'none', background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)',
        fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
      }}>
        Готово
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function ProductionPage() {
  const navigate = useNavigate()
  const { fetch: fetchMaterials, getStock: getMatStock } = useMaterialStore()
  const { fetch: fetchProducts } = useProductStore()

  useEffect(() => {
    fetchMaterials()
    fetchProducts()
  }, [])

  const [materialLines, setMaterialLines] = useState<MaterialLine[]>([{ materialId: '', qty: 1 }])
  const [productLines,  setProductLines]  = useState<ProductLine[]>([{ productId: '', qty: 1 }])
  const [comment, setComment]             = useState('')
  const [done, setDone]                   = useState(false)
  const [error, setError]                 = useState('')

  const totalUnits = productLines
    .filter((l) => l.productId && l.qty > 0)
    .reduce((s, l) => s + l.qty, 0)

  function updateMaterialLine(i: number, patch: Partial<MaterialLine>) {
    setMaterialLines((prev) => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))
  }
  function removeMaterialLine(i: number) {
    setMaterialLines((prev) => prev.filter((_, idx) => idx !== i))
  }
  function updateProductLine(i: number, patch: Partial<ProductLine>) {
    setProductLines((prev) => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))
  }
  function removeProductLine(i: number) {
    setProductLines((prev) => prev.filter((_, idx) => idx !== i))
  }

  function validate() {
    const matLines = materialLines.filter((l) => l.materialId)
    const prdLines = productLines.filter((l) => l.productId)
    if (matLines.length === 0 && prdLines.length === 0)
      return 'Добавьте хотя бы один материал или товар'
    for (const l of matLines) {
      if (l.qty <= 0) return 'Количество материала должно быть больше 0'
      if (l.qty > getMatStock(l.materialId)) return 'Недостаточно материала на складе'
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')

    const note = comment || `Производство ${new Date().toLocaleDateString('ru-RU')}`

    try {
      await productionApi.create({
        notes: note,
        materials: materialLines
          .filter((l) => l.materialId && l.qty > 0)
          .map((l) => ({ materialId: l.materialId, qty: l.qty })),
        products: productLines
          .filter((l) => l.productId && l.qty > 0)
          .map((l) => ({ productId: l.productId, qty: l.qty })),
      })
      setDone(true)
    } catch {
      setError('Ошибка при отправке. Попробуйте ещё раз.')
    }
  }

  if (done) return <SuccessScreen onDone={() => navigate('/warehouse')} />

  const hasStockError = materialLines.some(
    (l) => l.materialId && l.qty > getMatStock(l.materialId),
  )

  return (
    <div style={{ minHeight: '100dvh' }}>
      <PageHeader title="Производство" back />

      {/* How it works banner */}
      <div style={{
        margin: '16px 16px 0', padding: '12px 16px',
        borderRadius: 'var(--radius-xl)', background: 'var(--surface-sunken)',
        border: '1px solid var(--border-subtle)',
      }}>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Логика:</span>{' '}
          вы вручную указываете, сколько материала фактически израсходовано{' '}
          <span style={{ color: 'var(--danger-fg)' }}>↓ списывается</span> с сырьевого склада, и сколько готовых товаров произведено{' '}
          <span style={{ color: 'var(--success-fg)' }}>↑ добавляется</span> на склад.
          Нажмите <span style={{ color: 'var(--accent-text)' }}>⊞</span> в строке материала, чтобы рассчитать расход автоматически.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '20px 16px', paddingBottom: 104, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Products block */}
        <section>
          <div style={{ marginBottom: 12 }}>
            <p className="m-label">Выпуск продукции</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, marginBottom: 0 }}>
              Что добавляется на склад готовых товаров
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {productLines.map((l, i) => (
              <ProductRow key={i} line={l} index={i} onChange={updateProductLine} onRemove={removeProductLine} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setProductLines((p) => [...p, { productId: '', qty: 1 }])}
            style={{
              marginTop: 8, width: '100%', padding: '10px 0',
              borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-default)',
              background: 'none', cursor: 'pointer', fontSize: 12,
              color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Plus size={12} weight="bold" /> Добавить товар
          </button>
        </section>

        {/* Materials block */}
        <section>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
            <div>
              <p className="m-label">Расход сырья</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, marginBottom: 0 }}>
                Что списывается с сырьевого склада
              </p>
            </div>
            {totalUnits > 0 && (
              <span style={{
                fontSize: 10, color: 'var(--accent-text)',
                background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
                padding: '2px 8px', borderRadius: 'var(--radius-lg)', flexShrink: 0, marginTop: 2,
              }}>
                {totalUnits} изд. к выпуску
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {materialLines.map((l, i) => (
              <MaterialRow
                key={i} line={l} index={i} totalUnits={totalUnits}
                onChange={updateMaterialLine} onRemove={removeMaterialLine}
                getStock={getMatStock}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setMaterialLines((p) => [...p, { materialId: '', qty: 1 }])}
            style={{
              marginTop: 8, width: '100%', padding: '10px 0',
              borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-default)',
              background: 'none', cursor: 'pointer', fontSize: 12,
              color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Plus size={12} weight="bold" /> Добавить материал
          </button>
        </section>

        {/* Comment */}
        <section>
          <p className="m-label" style={{ marginBottom: 8 }}>Комментарий</p>
          <textarea
            value={comment} onChange={(e) => setComment(e.target.value)}
            rows={2} placeholder="Партия, исполнитель, примечание…"
            className="input-field" style={{ resize: 'none', padding: '12px 14px' }}
          />
        </section>

        {/* Error */}
        {(error || hasStockError) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px', borderRadius: 'var(--radius-xl)',
            background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
          }}>
            <WarningCircle size={16} weight="fill" style={{ color: 'var(--danger-fg)', flexShrink: 0 }} />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--danger-fg)', margin: 0 }}>
              {error || 'Недостаточно материала на складе'}
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={hasStockError}
          style={{
            width: '100%', padding: '16px 0', borderRadius: 'var(--radius-2xl)',
            border: 'none', background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)',
            fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: 'var(--shadow-md)',
            opacity: hasStockError ? 0.4 : 1,
          }}
        >
          <Factory size={18} weight="duotone" />
          Завершить производство
        </button>
      </form>
    </div>
  )
}
