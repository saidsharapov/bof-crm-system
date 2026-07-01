import { useState, useEffect } from 'react'
import { Plus, Trash, Calculator, CheckCircle } from '@phosphor-icons/react'
import { useMaterialStore } from '@/store/materialStore'
import { useProductStore }  from '@/store/productStore'
import { productionApi }    from '@/api/production'
import { SearchSelect }     from '@/components/ui/SearchSelect'
import { NumberInput }      from '@/components/ui/NumberInput'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProductRow  { productId: string; qty: number }
interface MaterialRow { materialId: string; qty: number; normPerUnit: number; calcOpen: boolean }

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px',
  background: 'var(--surface-card)',
  border: '1px solid var(--border-default)',
  borderRadius: 10, fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
  outline: 'none', boxSizing: 'border-box',
}

// ── RowShell — точно как в дизайн-системе ────────────────────────────────────
function RowShell({ children, onRemove, canRemove }: {
  children: React.ReactNode; onRemove: () => void; canRemove: boolean
}) {
  return (
    <div style={{
      position: 'relative',
      background: 'var(--bg-subtle)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: 14,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {children}
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        title="Удалить"
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--radius-md)',
          border: 'none', background: 'transparent', cursor: canRemove ? 'pointer' : 'default',
          color: 'var(--text-tertiary)', opacity: canRemove ? 1 : 0.35,
          transition: 'color 0.12s, background 0.12s',
        }}
        onMouseEnter={(e) => { if (canRemove) (e.currentTarget as HTMLElement).style.color = 'var(--danger-fg)' }}
        onMouseLeave={(e) => { if (canRemove) (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
      >
        <Trash size={14} />
      </button>
    </div>
  )
}

// ── PanelHeader ───────────────────────────────────────────────────────────────
function PanelHeader({ dot, kicker, title, count }: {
  dot: string; kicker: string; title: string; count: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase' as const, letterSpacing: 'var(--tracking-caps)', fontWeight: 700, color: 'var(--text-tertiary)' }}>{kicker}</div>
        <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
      </div>
      <span style={{
        marginLeft: 'auto',
        fontSize: 'var(--text-xs)', fontWeight: 600,
        padding: '2px 8px', borderRadius: 'var(--radius-full)',
        background: 'var(--surface-card)',
        color: 'var(--text-tertiary)',
        border: '1px solid var(--border-subtle)',
      }}>{count}</span>
    </div>
  )
}

// ── MaterialRowDesktop ────────────────────────────────────────────────────────
function MaterialRowDesktop({ row, index, totalUnits, onChange, onRemove }: {
  row: MaterialRow; index: number; totalUnits: number
  onChange: (i: number, patch: Partial<MaterialRow>) => void
  onRemove: (i: number) => void
}) {
  const { materials, getStock } = useMaterialStore()
  const mat   = materials.find((m) => m.id === row.materialId)
  const stock = row.materialId ? getStock(row.materialId) : 0
  const tooMany = row.qty > stock && row.qty > 0
  const remaining = mat ? stock - row.qty : null
  const calcResult = parseFloat((row.normPerUnit * totalUnits).toFixed(3))

  return (
    <RowShell onRemove={() => onRemove(index)} canRemove={true}>
      {/* Выбор материала */}
      <div style={{ paddingRight: 34 }}>
        <label style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>Материал</label>
        <SearchSelect
          value={row.materialId}
          onChange={(v) => onChange(index, { materialId: v, qty: 0 })}
          options={[
            { value: '', label: '— выберите материал —' },
            ...materials.map((m) => ({
              value: m.id,
              label: m.name,
              subLabel: `остаток: ${getStock(m.id)} ${m.unit}`,
            })),
          ]}
          placeholder="— выберите материал —"
          style={{ ...inputStyle, height: 40, padding: '0 12px', cursor: 'pointer' }}
        />
      </div>

      {row.materialId && (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {/* Qty */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>
                К списанию ({mat?.unit ?? 'кг'})
              </label>
              <NumberInput
                value={row.qty}
                onChange={(n) => onChange(index, { qty: n })}
                min={0}
                decimals
                style={{ ...inputStyle, borderColor: tooMany ? 'var(--danger-border)' : undefined,
                  background: tooMany ? 'var(--danger-bg)' : 'var(--surface-card)' }}
                placeholder="0"
              />
            </div>

            {/* Остаток после */}
            <div style={{ textAlign: 'right', paddingBottom: 2, minWidth: 120, flexShrink: 0 }}>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: 'var(--tracking-caps)', fontWeight: 600 }}>Остаток после</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 700, color: tooMany ? 'var(--danger-fg)' : 'var(--text-primary)', marginTop: 4 }}>
                {remaining !== null ? `${remaining} ${mat?.unit}` : '—'}
              </div>
            </div>

            {/* Калькулятор */}
            <button
              type="button"
              onClick={() => onChange(index, { calcOpen: !row.calcOpen })}
              title="Калькулятор нормы"
              style={{
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer', flexShrink: 0, marginBottom: 2,
                background: row.calcOpen ? 'var(--accent-soft)' : 'var(--surface-card)',
                color: row.calcOpen ? 'var(--accent-text)' : 'var(--text-tertiary)',
                border2: `1px solid ${row.calcOpen ? 'var(--accent-border)' : 'var(--border-default)'}`,
              } as React.CSSProperties}
            >
              <Calculator size={16} weight="duotone" />
            </button>
          </div>

          {tooMany && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--danger-fg)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Недостаточно: доступно {stock} {mat?.unit}
            </div>
          )}

          {/* Калькулятор нормы */}
          {row.calcOpen && (
            <div style={{
              padding: 12, background: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)',
              display: 'flex', flexDirection: 'column' as const, gap: 8,
            }}>
              <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: 'var(--tracking-caps)', fontWeight: 600, margin: 0 }}>
                Калькулятор нормы
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', flexWrap: 'wrap' as const }}>
                <NumberInput
                  value={row.normPerUnit ?? 0}
                  onChange={(n) => onChange(index, { normPerUnit: n })}
                  min={0}
                  decimals
                  style={{ ...inputStyle, width: 88, textAlign: 'center' }}
                  placeholder="0"
                />
                <span style={{ color: 'var(--text-tertiary)' }}>{mat?.unit} × {totalUnits} изд =</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{calcResult} {mat?.unit}</span>
              </div>
              <button type="button" onClick={() => onChange(index, { qty: calcResult })}
                style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-link)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: 'var(--font-sans)' }}>
                Подставить
              </button>
            </div>
          )}
        </>
      )}
    </RowShell>
  )
}

// ── ProductRowDesktop ─────────────────────────────────────────────────────────
function ProductRowDesktop({ row, index, onChange, onRemove }: {
  row: ProductRow; index: number
  onChange: (i: number, patch: Partial<ProductRow>) => void
  onRemove: (i: number) => void
}) {
  const { products } = useProductStore()

  return (
    <RowShell onRemove={() => onRemove(index)} canRemove={true}>
      <div style={{ paddingRight: 34 }}>
        <label style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>Готовая продукция</label>
        <SearchSelect
          value={row.productId}
          onChange={(v) => onChange(index, { productId: v })}
          options={[
            { value: '', label: '— выберите товар —' },
            ...products.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.size}, ${p.color})`,
              subLabel: p.article,
            })),
          ]}
          placeholder="— выберите товар —"
          style={{ ...inputStyle, height: 40, padding: '0 12px', cursor: 'pointer' }}
        />
      </div>

      {row.productId && (
        <div>
          <label style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>Количество (шт)</label>
          <NumberInput
            value={row.qty}
            onChange={(n) => onChange(index, { qty: n })}
            min={1}
            style={{ ...inputStyle, background: 'var(--surface-card)' }}
            placeholder="0"
          />
        </div>
      )}
    </RowShell>
  )
}

// ── ProductionDesktop ─────────────────────────────────────────────────────────
export function ProductionDesktop() {
  const { getStock: getMaterialStock, fetch: fetchMaterials } = useMaterialStore()
  const { fetch: fetchProducts } = useProductStore()

  useEffect(() => {
    fetchMaterials()
    fetchProducts()
  }, [])

  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([
    { materialId: '', qty: 0, normPerUnit: 0, calcOpen: false },
  ])
  const [productRows, setProductRows] = useState<ProductRow[]>([
    { productId: '', qty: 0 },
  ])
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors]       = useState<string[]>([])

  const totalUnits = productRows.reduce((sum, r) => sum + (r.qty || 0), 0)

  const hasOver = materialRows.some((r) => {
    if (!r.materialId || r.qty <= 0) return false
    return r.qty > getMaterialStock(r.materialId)
  })

  const valid = materialRows.length > 0 && productRows.length > 0 && totalUnits > 0 && !hasOver &&
    materialRows.every((r) => r.materialId && r.qty > 0) &&
    productRows.every((r) => r.productId && r.qty > 0)

  function updateMaterialRow(i: number, patch: Partial<MaterialRow>) {
    setMaterialRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function removeMaterialRow(i: number) {
    if (materialRows.length <= 1) return
    setMaterialRows((prev) => prev.filter((_, idx) => idx !== i))
  }
  function addMaterialRow() {
    setMaterialRows((prev) => [...prev, { materialId: '', qty: 0, normPerUnit: 0, calcOpen: false }])
  }

  function updateProductRow(i: number, patch: Partial<ProductRow>) {
    setProductRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function removeProductRow(i: number) {
    if (productRows.length <= 1) return
    setProductRows((prev) => prev.filter((_, idx) => idx !== i))
  }
  function addProductRow() {
    setProductRows((prev) => [...prev, { productId: '', qty: 0 }])
  }

  function handleSubmit() {
    const errs: string[] = []
    if (materialRows.length === 0) errs.push('Добавьте хотя бы один материал')
    for (const r of materialRows) {
      if (!r.materialId) errs.push('Выберите материал для каждой строки')
      else if (r.qty <= 0) errs.push('Укажите количество материала')
      else if (r.qty > getMaterialStock(r.materialId)) errs.push('Недостаточно материала на складе')
    }
    if (productRows.length === 0) errs.push('Добавьте хотя бы один товар')
    for (const r of productRows) {
      if (!r.productId) errs.push('Выберите товар для каждой строки')
      else if (r.qty <= 0) errs.push('Укажите количество товара')
    }
    if (errs.length > 0) { setErrors([...new Set(errs)]); return }
    setErrors([])
    productionApi.create({
      notes: 'Производство',
      materials: materialRows.map((r) => ({ materialId: r.materialId, qty: r.qty })),
      products:  productRows.map((r)  => ({ productId: r.productId,  qty: r.qty  })),
    }).then(() => {
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setMaterialRows([{ materialId: '', qty: 0, normPerUnit: 0, calcOpen: false }])
        setProductRows([{ productId: '', qty: 0 }])
      }, 3000)
    }).catch(() => setErrors(['Ошибка при сохранении. Проверьте соединение с сервером.']))
  }

  function handleReset() {
    setMaterialRows([{ materialId: '', qty: 0, normPerUnit: 0, calcOpen: false }])
    setProductRows([{ productId: '', qty: 0 }])
    setErrors([])
    setSubmitted(false)
  }

  return (
    <div style={{ padding: 24, height: '100%', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Заголовок */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)' }}>
              Производство
            </h2>
            <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
              Списание материалов и оприходование готовой продукции
            </p>
          </div>
        </div>

        {/* Баннер успеха */}
        {submitted && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px', borderRadius: 'var(--radius-2xl)',
            background: 'var(--success-bg)', border: '1px solid var(--success-border)',
          }} className="animate-fade-in">
            <CheckCircle size={20} weight="fill" style={{ color: 'var(--success-fg)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--success-fg)', margin: 0 }}>
                Производство проведено
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--success-fg)', opacity: 0.7, margin: '2px 0 0' }}>
                Списано {materialRows.length} материал(ов), оприходовано {totalUnits} шт готовой продукции. Остатки склада обновлены.
              </p>
            </div>
          </div>
        )}

        {/* Ошибки */}
        {errors.length > 0 && (
          <div style={{ padding: '14px 20px', borderRadius: 'var(--radius-2xl)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}>
            {errors.map((e) => (
              <p key={e} style={{ fontSize: 'var(--text-sm)', color: 'var(--danger-fg)', margin: 0 }}>{e}</p>
            ))}
          </div>
        )}

        {/* Две колонки */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* Левая: Материалы */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-sm)',
            padding: 24,
          }}>
            <PanelHeader dot="var(--danger-solid)" kicker="Расход" title="Материалы к списанию" count={`${materialRows.length} поз.`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {materialRows.map((row, i) => (
                <MaterialRowDesktop
                  key={i} row={row} index={i} totalUnits={totalUnits}
                  onChange={updateMaterialRow} onRemove={removeMaterialRow}
                />
              ))}
            </div>
            <button type="button" onClick={addMaterialRow}
              style={{
                marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-link)', fontSize: 'var(--text-sm)', fontWeight: 600,
                fontFamily: 'var(--font-sans)', padding: '4px 2px',
              }}>
              <Plus size={16} /> Добавить материал
            </button>
          </div>

          {/* Правая: Продукция */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-sm)',
            padding: 24,
          }}>
            <PanelHeader dot="var(--success-solid)" kicker="Приход" title="Готовая продукция" count={`${productRows.length} поз.`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {productRows.map((row, i) => (
                <ProductRowDesktop
                  key={i} row={row} index={i}
                  onChange={updateProductRow} onRemove={removeProductRow}
                />
              ))}
            </div>
            <button type="button" onClick={addProductRow}
              style={{
                marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-link)', fontSize: 'var(--text-sm)', fontWeight: 600,
                fontFamily: 'var(--font-sans)', padding: '4px 2px',
              }}>
              <Plus size={16} /> Добавить позицию
            </button>
          </div>
        </div>

        {/* Sticky нижняя панель */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 18,
          padding: '16px 20px',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-sm)',
          position: 'sticky', bottom: 0,
        }}>
          {/* Списание */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger-solid)' }} />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Списание</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {materialRows.length}
            </span>
          </div>

          <span style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />

          {/* Приход */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success-solid)' }} />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Приход</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {totalUnits} шт
            </span>
          </div>

          {hasOver && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--danger-fg)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Недостаточно материалов
            </span>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button onClick={handleReset} style={{
              padding: '9px 20px', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)', background: 'transparent', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
            }}>
              Отмена
            </button>
            <button onClick={handleSubmit} disabled={!valid} style={{
              padding: '9px 24px', borderRadius: 'var(--radius-lg)',
              border: 'none', cursor: valid ? 'pointer' : 'not-allowed',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              background: valid ? 'var(--accent)' : 'var(--surface-sunken)',
              color: valid ? 'var(--bof-yellow-ink)' : 'var(--text-disabled)',
              fontFamily: 'var(--font-sans)',
              transition: 'background 0.15s, color 0.15s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Провести производство
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
