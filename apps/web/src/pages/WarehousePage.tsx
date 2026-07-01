import { useState, useMemo, useEffect } from 'react'
import {
  Package, ArrowDown, ArrowUp, Clock, Warning,
} from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import { useStockStore }   from '@/store/stockStore'
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

// ── Page ──────────────────────────────────────────────────────────────────────
export function WarehousePage() {
  const { products, fetch: fetchProducts } = useProductStore()
  const { fetchStock, getStock } = useStockStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
    fetchStock()
  }, [])

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
        }
      />

      <main style={{ padding: '16px 16px', paddingBottom: 104, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                background: filterTab === key ? '#5b6ef5' : 'transparent',
                color: filterTab === key ? '#fff' : 'var(--text-tertiary)',
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
      </main>

      {/* Detail + history sheet */}
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
