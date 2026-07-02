import { useState, useMemo, useEffect } from 'react'
import { Plus, Funnel, Package, X } from '@phosphor-icons/react'
import { useProductStore, type Product } from '@/store/productStore'
import { useStockStore }  from '@/store/stockStore'
import { ProductAvatar }  from '@/components/products/ProductAvatar'
import { ProductForm }    from '@/components/products/ProductForm'
import { BottomSheet }    from '@/components/ui/BottomSheet'
import { SearchBar }      from '@/components/ui/SearchBar'
import { PageHeader }     from '@/components/ui/PageHeader'
import { EmptyState }     from '@/components/ui/EmptyState'

function useFilterOptions(products: Product[]) {
  return useMemo(() => {
    const sizes  = ['Все', ...new Set(products.map((p) => p.size).filter(Boolean))]
    const colors = ['Все', ...new Set(products.map((p) => p.color).filter(Boolean))]
    return { sizes, colors }
  }, [products])
}

// ── Product card ──────────────────────────────────────────────────────────────
function ProductCard({ product, stock, onTap }: { product: Product; stock: number; onTap: () => void }) {
  const stockColor = stock === 0
    ? { color: 'var(--danger-fg)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }
    : stock < 10
    ? { color: 'var(--warning-fg)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }
    : { color: 'var(--success-fg)', background: 'var(--success-bg)', border: '1px solid var(--success-border)' }

  return (
    <div
      onClick={onTap}
      className="m-card"
      style={{ overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow var(--dur-fast), transform var(--dur-fast)' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
    >
      {/* Photo */}
      <div style={{ aspectRatio: '1', position: 'relative' }}>
        <ProductAvatar photo={product.photo} name={product.name} className="w-full h-full" />
        <div
          style={{
            position: 'absolute', bottom: 8, right: 8,
            width: 14, height: 14, borderRadius: '50%',
            border: '2px solid var(--surface-card)',
            backgroundColor: product.colorHex,
          }}
        />
        <div style={{
          position: 'absolute', top: 8, left: 8,
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
          padding: '2px 6px', borderRadius: 'var(--radius-sm)',
          ...stockColor,
        }}>
          {stock === 0 ? 'Нет' : `${stock} шт`}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: 12 }}>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', margin: '0 0 8px' }}>
          {product.article}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-sunken)', color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}>
            {product.size}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.color}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Filter chips ──────────────────────────────────────────────────────────────
function FilterChips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="m-label" style={{ marginBottom: 6 }}>{label}</p>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${value === opt ? 'var(--accent-border)' : 'var(--border-default)'}`,
              background: value === opt ? 'var(--accent)' : 'var(--surface-sunken)',
              color: value === opt ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              fontWeight: value === opt ? 600 : 400,
              cursor: 'pointer',
              transition: 'all var(--dur-fast)',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Filter sheet ──────────────────────────────────────────────────────────────
function FilterSheet({ open, onClose, sizes, colors, filterSize, filterColor, onSize, onColor, onReset }: {
  open: boolean; onClose: () => void
  sizes: string[]; colors: string[]
  filterSize: string; filterColor: string
  onSize: (v: string) => void; onColor: (v: string) => void
  onReset: () => void
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Фильтры">
      <div style={{ padding: '4px 16px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FilterChips label="Размер" options={sizes} value={filterSize} onChange={onSize} />
        <FilterChips label="Цвет"   options={colors} value={filterColor} onChange={onColor} />
        <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
          <button onClick={onReset} style={{
            flex: 1, padding: '12px 0', borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-default)', background: 'none',
            color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer',
          }}>Сбросить</button>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px 0', borderRadius: 'var(--radius-xl)',
            border: 'none', background: 'var(--action-primary-bg)',
            color: 'var(--action-primary-fg)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
          }}>Применить</button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
type SheetMode = { type: 'none' } | { type: 'create' } | { type: 'edit'; product: Product }

export function ProductsPage() {
  const { products, add, update, remove, fetch: fetchProducts } = useProductStore()
  const { fetchStock, getStock } = useStockStore()

  useEffect(() => {
    fetchProducts()
    fetchStock()
  }, [])

  const [query,       setQuery]       = useState('')
  const [filterSize,  setFilterSize]  = useState('Все')
  const [filterColor, setFilterColor] = useState('Все')
  const [filterOpen,  setFilterOpen]  = useState(false)
  const [sheet,       setSheet]       = useState<SheetMode>({ type: 'none' })

  const { sizes, colors } = useFilterOptions(products)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return products.filter((p) => {
      if (q && !`${p.name} ${p.article} ${p.color}`.toLowerCase().includes(q)) return false
      if (filterSize  !== 'Все' && p.size  !== filterSize)  return false
      if (filterColor !== 'Все' && p.color !== filterColor) return false
      return true
    })
  }, [products, query, filterSize, filterColor])

  const hasFilters = filterSize !== 'Все' || filterColor !== 'Все'

  async function handleSave(data: Parameters<typeof add>[0]) {
    if (sheet.type === 'create') await add(data)
    else if (sheet.type === 'edit') await update(sheet.product.id, data)
    setSheet({ type: 'none' })
  }
  async function handleDelete() {
    if (sheet.type === 'edit') { await remove(sheet.product.id); setSheet({ type: 'none' }) }
  }

  return (
    <div style={{ minHeight: '100dvh' }}>
      <PageHeader
        title="Товары"
        right={
          <button
            onClick={() => setFilterOpen(true)}
            style={{
              padding: 8, borderRadius: 'var(--radius-lg)',
              border: 'none', cursor: 'pointer',
              background: hasFilters ? 'var(--accent-soft)' : 'none',
              color: hasFilters ? 'var(--accent-text)' : 'var(--text-tertiary)',
            }}
            aria-label="Фильтры"
          >
            <Funnel size={18} weight={hasFilters ? 'fill' : 'regular'} />
          </button>
        }
      />

      <main style={{ padding: '16px 16px', paddingBottom: 104, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Поиск по названию, артикулу…" />

        {/* Active filter pills */}
        {hasFilters && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {filterSize !== 'Все' && (
              <button onClick={() => setFilterSize('Все')} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 'var(--radius-lg)',
                background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
                color: 'var(--accent-text)', fontSize: 11, cursor: 'pointer',
              }}>
                Размер: {filterSize} <X size={10} />
              </button>
            )}
            {filterColor !== 'Все' && (
              <button onClick={() => setFilterColor('Все')} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 'var(--radius-lg)',
                background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
                color: 'var(--accent-text)', fontSize: 11, cursor: 'pointer',
              }}>
                Цвет: {filterColor} <X size={10} />
              </button>
            )}
          </div>
        )}

        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
          {filtered.length} из {products.length} товаров
        </p>

        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} stock={getStock(p.id)} onTap={() => setSheet({ type: 'edit', product: p })} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Package size={48} weight="thin" />}
            title={query || hasFilters ? 'Ничего не найдено' : 'Нет товаров'}
            subtitle={query || hasFilters ? 'Попробуйте изменить фильтры' : 'Добавьте первый товар'}
            action={!query && !hasFilters ? (
              <button onClick={() => setSheet({ type: 'create' })} style={{
                marginTop: 8, padding: '10px 20px', borderRadius: 'var(--radius-xl)',
                border: 'none', background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)',
                fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
              }}>
                + Добавить товар
              </button>
            ) : undefined}
          />
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setSheet({ type: 'create' })}
        style={{
          position: 'fixed', bottom: 88, right: 16, zIndex: 30,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(255,237,0,0.35)',
          transition: 'transform var(--dur-fast)',
        }}
        aria-label="Добавить товар"
      >
        <Plus size={24} weight="bold" />
      </button>

      <BottomSheet
        open={sheet.type !== 'none'}
        onClose={() => setSheet({ type: 'none' })}
        title={sheet.type === 'create' ? 'Новый товар' : 'Редактировать'}
        tall
      >
        {sheet.type !== 'none' && (
          <ProductForm
            initial={sheet.type === 'edit' ? sheet.product : undefined}
            onSave={handleSave}
            onDelete={sheet.type === 'edit' ? handleDelete : undefined}
            onCancel={() => setSheet({ type: 'none' })}
          />
        )}
      </BottomSheet>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        sizes={sizes}
        colors={colors}
        filterSize={filterSize}
        filterColor={filterColor}
        onSize={setFilterSize}
        onColor={setFilterColor}
        onReset={() => { setFilterSize('Все'); setFilterColor('Все') }}
      />
    </div>
  )
}
