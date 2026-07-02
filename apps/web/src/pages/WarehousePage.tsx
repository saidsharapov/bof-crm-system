import { useState, useMemo, useEffect } from 'react'
import {
  Package, ArrowDown, ArrowUp, Clock, Warning, Pencil, Trash,
} from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import { useStockStore }   from '@/store/stockStore'
import { useMaterialStore, type Material } from '@/store/materialStore'
import { useAuthStore }    from '@/store/authStore'
import { ProductAvatar }   from '@/components/products/ProductAvatar'
import { BottomSheet }     from '@/components/ui/BottomSheet'
import { SearchBar }       from '@/components/ui/SearchBar'
import { PageHeader }      from '@/components/ui/PageHeader'
import { EmptyState }      from '@/components/ui/EmptyState'

// ── Movement history list ─────────────────────────────────────────────────────
function MovementList({ productId }: { productId: string }) {
  const { fetchMovements, getHistory } = useStockStore()
  useEffect(() => { fetchMovements(productId) }, [productId])
  const history = getHistory(productId)

  if (history.length === 0) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <Clock size={36} style={{ color: 'var(--text-disabled)', margin: '0 auto 12px' }} weight="thin" />
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>История пуста</p>
      </div>
    )
  }

  return (
    <ul className="divide-ds">
      {history.map((mv) => {
        const isIn  = mv.type === 'IN'
        const date  = new Date(mv.createdAt)
        const label = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
        const time  = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        return (
          <li key={mv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: isIn ? 'var(--success-bg)' : 'var(--danger-bg)',
            }}>
              {isIn
                ? <ArrowDown size={14} weight="bold" style={{ color: 'var(--success-fg)' }} />
                : <ArrowUp   size={14} weight="bold" style={{ color: 'var(--danger-fg)'  }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                {isIn ? 'Приход' : 'Расход'}{' '}
                <span style={{ fontWeight: 700, color: isIn ? 'var(--success-fg)' : 'var(--danger-fg)' }}>
                  {isIn ? '+' : '−'}{mv.qty} шт
                </span>
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0' }}>
                {mv.comment || '—'}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>{label}</p>
              <p style={{ fontSize: 10, color: 'var(--text-disabled)', margin: '1px 0 0' }}>{time}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ── Stock level bar ───────────────────────────────────────────────────────────
function StockBar({ qty, max }: { qty: number; max: number }) {
  const pct = max > 0 ? Math.min(qty / max, 1) : 0
  const color =
    qty === 0  ? 'var(--danger-solid)'
    : pct < 0.2 ? 'var(--warning-solid)'
    : 'var(--success-solid)'

  return (
    <div style={{ height: 3, width: '100%', background: 'var(--border-subtle)', borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', borderRadius: 999, background: color, width: `${(pct * 100).toFixed(0)}%`, transition: 'width 0.5s' }} />
    </div>
  )
}

// ── Stock row ─────────────────────────────────────────────────────────────────
function StockRow({
  product, stock, maxStock, onTap,
}: {
  product: ReturnType<typeof useProductStore.getState>['products'][0]
  stock: number
  maxStock: number
  onTap: () => void
}) {
  const badge =
    stock === 0  ? { label: 'Нет',      color: 'var(--danger-fg)',   bg: 'var(--danger-bg)',   border: 'var(--danger-border)'   }
    : stock < 10  ? { label: 'Мало',     color: 'var(--warning-fg)',  bg: 'var(--warning-bg)',  border: 'var(--warning-border)'  }
    : { label: 'В наличии', color: 'var(--success-fg)',  bg: 'var(--success-bg)',  border: 'var(--success-border)' }

  return (
    <li
      onClick={onTap}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', cursor: 'pointer', transition: 'background var(--dur-fast)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Thumbnail */}
      <div style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
        <ProductAvatar photo={product.photo} name={product.name} className="w-full h-full" />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
            {product.name}
          </p>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
            {product.article}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', border: '1px solid var(--border-default)', backgroundColor: product.colorHex, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{product.color}</span>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{product.size}</span>
        </div>
        <StockBar qty={stock} max={maxStock} />
      </div>

      {/* Stock + badge */}
      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', margin: 0 }}>{stock}</p>
        <span style={{
          fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
          padding: '2px 6px', borderRadius: 6, border: `1px solid ${badge.border}`,
          color: badge.color, background: badge.bg,
        }}>
          {badge.label}
        </span>
      </div>
    </li>
  )
}

// ── Stats bar at top ──────────────────────────────────────────────────────────
function StatsBar({ products, getStock }: { products: ReturnType<typeof useProductStore.getState>['products']; getStock: (id: string) => number }) {
  const inStock  = products.filter((p) => getStock(p.id) > 0).length
  const lowStock = products.filter((p) => { const s = getStock(p.id); return s > 0 && s < 10 }).length
  const noStock  = products.filter((p) => getStock(p.id) === 0).length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      {[
        { label: 'В наличии', value: inStock,  color: 'var(--success-fg)' },
        { label: 'Мало',      value: lowStock, color: 'var(--warning-fg)' },
        { label: 'Нет',       value: noStock,  color: 'var(--danger-fg)'  },
      ].map(({ label, value, color }) => (
        <div key={label} className="m-card" style={{ padding: 12, textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
          <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color, margin: 0 }}>{value}</p>
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2, marginBottom: 0 }}>{label}</p>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MATERIALS TAB COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

const MATERIAL_UNITS = ['кг', 'м', 'л', 'шт', 'рулон', 'пачка'] as const

// ── Materials stats bar ───────────────────────────────────────────────────────
function MaterialStatsBar({
  materials,
  getStock,
}: {
  materials: Material[]
  getStock: (id: string) => number
}) {
  const inStock  = materials.filter((m) => getStock(m.id) > 5).length
  const lowStock = materials.filter((m) => { const s = getStock(m.id); return s > 0 && s <= 5 }).length
  const noStock  = materials.filter((m) => getStock(m.id) === 0).length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      {[
        { label: 'В наличии', value: inStock,  color: 'var(--success-fg)', bg: 'var(--success-bg)' },
        { label: 'Мало',      value: lowStock, color: 'var(--warning-fg)', bg: 'var(--warning-bg)' },
        { label: 'Нет',       value: noStock,  color: 'var(--danger-fg)',  bg: 'var(--danger-bg)'  },
      ].map(({ label, value, color }) => (
        <div key={label} className="m-card" style={{ padding: 12, textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
          <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color, margin: 0 }}>{value}</p>
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2, marginBottom: 0 }}>{label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Material row ──────────────────────────────────────────────────────────────
function MaterialRow({
  material,
  stock,
  onTap,
}: {
  material: Material
  stock: number
  onTap: () => void
}) {
  const badge =
    stock === 0 ? { label: 'Нет',      color: 'var(--danger-fg)',   bg: 'var(--danger-bg)',   border: 'var(--danger-border)'   }
    : stock <= 5 ? { label: 'Мало',    color: 'var(--warning-fg)',  bg: 'var(--warning-bg)',  border: 'var(--warning-border)'  }
    :              { label: 'В наличии', color: 'var(--success-fg)', bg: 'var(--success-bg)', border: 'var(--success-border)' }

  return (
    <li
      onClick={onTap}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', cursor: 'pointer', transition: 'background var(--dur-fast)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 18 }}>🧵</span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0,
        }}>
          {material.name}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
          {material.unit}
        </p>
      </div>

      {/* Stock + badge */}
      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', margin: 0 }}>
          {stock}
        </p>
        <span style={{
          fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
          padding: '2px 6px', borderRadius: 6, border: `1px solid ${badge.border}`,
          color: badge.color, background: badge.bg,
        }}>
          {badge.label}
        </span>
      </div>
    </li>
  )
}

// ── Materials tab ─────────────────────────────────────────────────────────────
function MaterialsTab() {
  const { materials, loading, fetch, getStock, addMaterial, updateMaterial, removeMaterial, addMovement } = useMaterialStore()
  const user = useAuthStore((s) => s.user)

  useEffect(() => { fetch() }, [])

  const [query, setQuery] = useState('')

  // Detail sheet (movement)
  const [detailMat, setDetailMat] = useState<Material | null>(null)
  const [movType,   setMovType]   = useState<'IN' | 'OUT'>('IN')
  const [movQty,    setMovQty]    = useState('')
  const [movComment, setMovComment] = useState('')
  const [movSaving, setMovSaving]  = useState(false)

  // Create/edit sheet
  const [editSheet, setEditSheet]  = useState(false)
  const [editTarget, setEditTarget] = useState<Material | null>(null)
  const [formName, setFormName]    = useState('')
  const [formUnit, setFormUnit]    = useState<string>(MATERIAL_UNITS[0])
  const [formDesc, setFormDesc]    = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteId, setDeleteId]           = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return materials.filter((m) =>
      !q || m.name.toLowerCase().includes(q) || m.unit.toLowerCase().includes(q),
    )
  }, [materials, query])

  function openCreate() {
    setEditTarget(null)
    setFormName('')
    setFormUnit(MATERIAL_UNITS[0])
    setFormDesc('')
    setEditSheet(true)
  }

  function openEdit(mat: Material) {
    setEditTarget(mat)
    setFormName(mat.name)
    setFormUnit(mat.unit)
    setFormDesc(mat.description ?? '')
    setDetailMat(null)
    setEditSheet(true)
  }

  async function handleSaveMaterial() {
    if (!formName.trim()) return
    setFormSaving(true)
    try {
      if (editTarget) {
        await updateMaterial(editTarget.id, { name: formName.trim(), unit: formUnit, description: formDesc.trim() })
      } else {
        await addMaterial({ name: formName.trim(), unit: formUnit, description: formDesc.trim() })
      }
      setEditSheet(false)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDeleteMaterial() {
    if (!deleteId) return
    await removeMaterial(deleteId)
    setDeleteConfirm(false)
    setDeleteId(null)
    setEditSheet(false)
  }

  async function handleSaveMovement() {
    if (!detailMat) return
    const qty = parseFloat(movQty)
    if (!qty || qty <= 0) return
    setMovSaving(true)
    try {
      await addMovement(detailMat.id, movType, qty, movComment.trim(), user?.name ?? 'unknown')
      setMovQty('')
      setMovComment('')
      setDetailMat(null)
    } finally {
      setMovSaving(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stats */}
        <MaterialStatsBar materials={materials} getStock={getStock} />

        {/* Search */}
        <SearchBar value={query} onChange={setQuery} placeholder="Поиск по сырью…" />

        {/* List */}
        {loading && materials.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>Загрузка…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="m-list">
            <ul>
              {filtered.map((mat) => (
                <MaterialRow
                  key={mat.id}
                  material={mat}
                  stock={getStock(mat.id)}
                  onTap={() => {
                    setDetailMat(mat)
                    setMovType('IN')
                    setMovQty('')
                    setMovComment('')
                  }}
                />
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            icon={<Package size={48} weight="thin" />}
            title="Сырьё не найдено"
            subtitle={query ? 'Измените поисковый запрос' : 'Добавьте первое сырьё'}
          />
        )}
      </div>

      {/* FAB — Add material */}
      <button
        onClick={openCreate}
        style={{
          position: 'fixed', bottom: 88, right: 20, zIndex: 50,
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--accent)', border: 'none',
          color: 'var(--text-on-accent)', fontSize: 24, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        }}
        title="Добавить сырьё"
      >
        +
      </button>

      {/* Material detail / movement sheet */}
      <BottomSheet
        open={!!detailMat && !editSheet}
        onClose={() => setDetailMat(null)}
        title={detailMat?.name ?? ''}
        tall
      >
        {detailMat && (
          <div>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 16px 16px', borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>{detailMat.unit}</p>
                <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', margin: '4px 0 0' }}>
                  {getStock(detailMat.id)}
                </p>
              </div>
              <button
                onClick={() => openEdit(detailMat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)',
                  fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
                }}
              >
                <Pencil size={14} />
                Изменить
              </button>
            </div>

            {/* Movement type toggle */}
            <div style={{ padding: '12px 16px 8px' }}>
              <div style={{
                display: 'flex', gap: 4, padding: 4,
                background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
              }}>
                <button
                  onClick={() => setMovType('IN')}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 'var(--radius-lg)',
                    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: movType === 'IN' ? 'var(--success-bg)' : 'transparent',
                    color: movType === 'IN' ? 'var(--success-fg)' : 'var(--text-tertiary)',
                    transition: 'all var(--dur-fast)',
                  }}
                >
                  + Приход
                </button>
                <button
                  onClick={() => setMovType('OUT')}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 'var(--radius-lg)',
                    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: movType === 'OUT' ? 'var(--danger-bg)' : 'transparent',
                    color: movType === 'OUT' ? 'var(--danger-fg)' : 'var(--text-tertiary)',
                    transition: 'all var(--dur-fast)',
                  }}
                >
                  − Расход
                </button>
              </div>
            </div>

            {/* Qty + comment */}
            <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="number"
                min={0}
                step="any"
                placeholder={`Количество (${detailMat.unit})`}
                value={movQty}
                onChange={(e) => setMovQty(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-default)', background: 'var(--surface-base)',
                  color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
                }}
              />
              <input
                type="text"
                placeholder="Комментарий (необязательно)"
                value={movComment}
                onChange={(e) => setMovComment(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-default)', background: 'var(--surface-base)',
                  color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
                }}
              />
              <button
                onClick={handleSaveMovement}
                disabled={movSaving || !movQty || parseFloat(movQty) <= 0}
                style={{
                  padding: '12px 0', borderRadius: 'var(--radius-xl)',
                  background: movType === 'IN' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  border: `1px solid ${movType === 'IN' ? 'var(--success-border)' : 'var(--danger-border)'}`,
                  fontSize: 14, fontWeight: 600,
                  color: movType === 'IN' ? 'var(--success-fg)' : 'var(--danger-fg)',
                  cursor: movSaving ? 'not-allowed' : 'pointer',
                  opacity: movSaving || !movQty || parseFloat(movQty) <= 0 ? 0.5 : 1,
                }}
              >
                {movSaving ? 'Сохранение…' : (movType === 'IN' ? 'Записать приход' : 'Записать расход')}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Create / Edit material sheet */}
      <BottomSheet
        open={editSheet}
        onClose={() => setEditSheet(false)}
        title={editTarget ? 'Редактировать сырьё' : 'Добавить сырьё'}
      >
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            placeholder="Название"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)', background: 'var(--surface-base)',
              color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
            }}
          />

          <select
            value={formUnit}
            onChange={(e) => setFormUnit(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)', background: 'var(--surface-base)',
              color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
            }}
          >
            {MATERIAL_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Описание (необязательно)"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)', background: 'var(--surface-base)',
              color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
            }}
          />

          <button
            onClick={handleSaveMaterial}
            disabled={formSaving || !formName.trim()}
            style={{
              padding: '12px 0', borderRadius: 'var(--radius-xl)',
              background: 'var(--action-primary-bg)', border: 'none',
              fontSize: 14, fontWeight: 600, color: 'var(--action-primary-fg)',
              cursor: formSaving ? 'not-allowed' : 'pointer',
              opacity: formSaving || !formName.trim() ? 0.5 : 1,
            }}
          >
            {formSaving ? 'Сохранение…' : (editTarget ? 'Сохранить' : 'Добавить')}
          </button>

          {editTarget && (
            <>
              {!deleteConfirm ? (
                <button
                  onClick={() => { setDeleteId(editTarget.id); setDeleteConfirm(true) }}
                  style={{
                    padding: '10px 0', borderRadius: 'var(--radius-xl)',
                    background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
                    fontSize: 13, fontWeight: 600, color: 'var(--danger-fg)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Trash size={14} />
                  Удалить
                </button>
              ) : (
                <div style={{
                  padding: '12px 14px', borderRadius: 'var(--radius-xl)',
                  background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
                }}>
                  <p style={{ fontSize: 13, color: 'var(--danger-fg)', margin: '0 0 10px', fontWeight: 600 }}>
                    Удалить «{editTarget.name}»? Это действие необратимо.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 'var(--radius-lg)',
                        background: 'var(--surface-base)', border: '1px solid var(--border-default)',
                        fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
                      }}
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleDeleteMaterial}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 'var(--radius-lg)',
                        background: 'var(--danger-solid)', border: 'none',
                        fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </BottomSheet>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function WarehousePage() {
  const { products, fetch: fetchProducts } = useProductStore()
  const { fetchStock, getStock } = useStockStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
    fetchStock()
  }, [])

  const [mainTab,    setMainTab]    = useState<'products' | 'materials'>('products')
  const [query,      setQuery]      = useState('')
  const [filterTab,  setFilterTab]  = useState<'all' | 'low' | 'empty'>('all')
  const [detailId,   setDetailId]   = useState<string | null>(null)

  const detailProduct = products.find((p) => p.id === detailId)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return products
      .filter((p) => {
        if (q && !`${p.name} ${p.article} ${p.color}`.toLowerCase().includes(q)) return false
        const s = getStock(p.id)
        if (filterTab === 'low')   return s > 0 && s < 10
        if (filterTab === 'empty') return s === 0
        return true
      })
      .sort((a, b) => getStock(a.id) - getStock(b.id))
  }, [products, query, filterTab, getStock])

  const maxStock = useMemo(
    () => Math.max(...products.map((p) => getStock(p.id)), 1),
    [products, getStock],
  )

  const lowCount   = products.filter((p) => { const s = getStock(p.id); return s > 0 && s < 10 }).length
  const emptyCount = products.filter((p) => getStock(p.id) === 0).length

  return (
    <div style={{ minHeight: '100dvh' }}>
      <PageHeader
        title="Склад"
        right={
          mainTab === 'products' ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => navigate('/warehouse/receipt')}
                style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-lg)',
                  background: 'var(--success-bg)', border: '1px solid var(--success-border)',
                  fontSize: 11, fontWeight: 600, color: 'var(--success-fg)', cursor: 'pointer',
                }}
              >
                + Приход
              </button>
              <button
                onClick={() => navigate('/warehouse/expense')}
                style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-lg)',
                  background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
                  fontSize: 11, fontWeight: 600, color: 'var(--danger-fg)', cursor: 'pointer',
                }}
              >
                − Расход
              </button>
            </div>
          ) : undefined
        }
      />

      <main style={{ padding: '16px 16px', paddingBottom: 104, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Main tab switcher: Товары / Сырьё */}
        <div style={{
          display: 'flex', gap: 4, padding: 4,
          background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
        }}>
          {(['products', 'materials'] as const).map((tab) => {
            const label = tab === 'products' ? 'Товары' : 'Сырьё'
            const active = mainTab === tab
            return (
              <button
                key={tab}
                onClick={() => setMainTab(tab)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 'var(--radius-lg)',
                  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--text-on-accent)' : 'var(--text-tertiary)',
                  transition: 'all var(--dur-fast)',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* ── Товары tab ── */}
        {mainTab === 'products' && (
          <>
            {/* Stats */}
            <StatsBar products={products} getStock={getStock} />

            {/* Search */}
            <SearchBar value={query} onChange={setQuery} placeholder="Поиск по товарам…" />

            {/* Tab filter */}
            <div style={{
              display: 'flex', gap: 4, padding: 4,
              background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
            }}>
              {([
                ['all',   'Все',          null        ],
                ['low',   'Мало',         lowCount    ],
                ['empty', 'Нет остатка',  emptyCount  ],
              ] as [string, string, number | null][]).map(([key, label, count]) => (
                <button
                  key={key}
                  onClick={() => setFilterTab(key as typeof filterTab)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 0', borderRadius: 'var(--radius-lg)',
                    border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: filterTab === key ? 'var(--accent)' : 'transparent',
                    color: filterTab === key ? 'var(--text-on-accent)' : 'var(--text-tertiary)',
                    transition: 'all var(--dur-fast)',
                  }}
                >
                  {label}
                  {count !== null && count > 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 999,
                      background: filterTab === key ? 'rgba(255,255,255,0.2)' : 'var(--border-default)',
                      color: filterTab === key ? '#fff' : 'var(--text-tertiary)',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Low stock alert banner */}
            {(lowCount > 0 || emptyCount > 0) && filterTab === 'all' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 'var(--radius-xl)',
                background: 'var(--warning-bg)', border: '1px solid var(--warning-border)',
              }}>
                <Warning size={16} weight="fill" style={{ color: 'var(--warning-fg)', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: 'var(--warning-fg)', margin: 0 }}>
                  {emptyCount > 0 && `${emptyCount} товар(а) закончились`}
                  {emptyCount > 0 && lowCount > 0 && ', '}
                  {lowCount > 0 && `${lowCount} с низким остатком`}
                </p>
              </div>
            )}

            {/* List */}
            {filtered.length > 0 ? (
              <div className="m-list">
                <ul>
                  {filtered.map((p) => (
                    <StockRow
                      key={p.id}
                      product={p}
                      stock={getStock(p.id)}
                      maxStock={maxStock}
                      onTap={() => setDetailId(p.id)}
                    />
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyState
                icon={<Package size={48} weight="thin" />}
                title="Ничего не найдено"
                subtitle="Измените запрос или фильтр"
              />
            )}
          </>
        )}

        {/* ── Сырьё tab ── */}
        {mainTab === 'materials' && <MaterialsTab />}
      </main>

      {/* Detail + history sheet (products) */}
      <BottomSheet
        open={!!detailId && !!detailProduct}
        onClose={() => setDetailId(null)}
        title={detailProduct?.name ?? ''}
        tall
      >
        {detailProduct && (
          <div>
            {/* Product mini-card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                <ProductAvatar photo={detailProduct.photo} name={detailProduct.name} className="w-full h-full" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {detailProduct.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', margin: '2px 0 0' }}>
                  {detailProduct.article}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', border: '1px solid var(--border-default)', backgroundColor: detailProduct.colorHex }} />
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {detailProduct.color} · {detailProduct.size}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {getStock(detailProduct.id)}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-tertiary)', margin: 0 }}>штук</p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => { setDetailId(null); navigate(`/warehouse/receipt?productId=${detailProduct.id}`) }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 'var(--radius-xl)',
                  background: 'var(--success-bg)', border: '1px solid var(--success-border)',
                  fontSize: 12, fontWeight: 600, color: 'var(--success-fg)', cursor: 'pointer',
                }}
              >
                + Приход
              </button>
              <button
                onClick={() => { setDetailId(null); navigate(`/warehouse/expense?productId=${detailProduct.id}`) }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 'var(--radius-xl)',
                  background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
                  fontSize: 12, fontWeight: 600, color: 'var(--danger-fg)', cursor: 'pointer',
                }}
              >
                − Расход
              </button>
            </div>

            {/* History */}
            <p className="m-label" style={{ padding: '12px 16px 4px' }}>История движений</p>
            <MovementList productId={detailProduct.id} />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
