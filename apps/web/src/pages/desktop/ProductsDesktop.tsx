import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, MagnifyingGlass, Pencil, Trash, X } from '@phosphor-icons/react'
import { useProductStore, type Product } from '@/store/productStore'
import { useStockStore }  from '@/store/stockStore'
import { ProductAvatar }  from '@/components/products/ProductAvatar'

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  name:        z.string().min(1, 'Введите название'),
  article:     z.string().min(1, 'Введите артикул'),
  size:        z.string().min(1, 'Выберите размер'),
  color:       z.string().min(1, 'Введите цвет'),
  colorHex:    z.string().default('#ffffff'),
  description: z.string().default(''),
})
type FormData = z.infer<typeof schema>

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Без размера']

// ── Modal ─────────────────────────────────────────────────────────────────────
function ProductModal({
  target,
  onClose,
}: {
  target: 'new' | Product
  onClose: () => void
}) {
  const { add, update, remove } = useProductStore()
  const isNew = target === 'new'
  const product = isNew ? null : (target as Product)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          name:        product.name,
          article:     product.article,
          size:        product.size,
          color:       product.color,
          colorHex:    product.colorHex,
          description: product.description,
        }
      : { colorHex: '#ffffff', description: '' },
  })

  function onSubmit(data: FormData) {
    if (isNew) {
      add({ ...data, photo: '' })
    } else if (product) {
      update(product.id, data)
    }
    onClose()
  }

  function handleDelete() {
    if (product && window.confirm(`Удалить товар "${product.name}"?`)) {
      remove(product.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'var(--scrim)' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="relative animate-fade-up"
        style={{
          background: 'var(--surface-overlay)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: '0 12px 24px rgba(16,18,27,0.15)',
          width: 520,
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: 24,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {isNew ? 'Добавить товар' : 'Редактировать товар'}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-lg)',
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: 'var(--text-tertiary)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
              Название
            </label>
            <input {...register('name')} className="input-field" placeholder="Футболка базовая" />
            {errors.name && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-fg)' }}>{errors.name.message}</p>}
          </div>

          {/* Article */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
              Артикул
            </label>
            <input {...register('article')} className="input-field font-mono" placeholder="FBZ-M-WHT" />
            {errors.article && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-fg)' }}>{errors.article.message}</p>}
          </div>

          {/* Size */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
              Размер
            </label>
            <select {...register('size')} className="input-field">
              <option value="">— выберите размер —</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.size && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-fg)' }}>{errors.size.message}</p>}
          </div>

          {/* Color */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
              Цвет
            </label>
            <input {...register('color')} className="input-field" placeholder="Белый" />
            {errors.color && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-fg)' }}>{errors.color.message}</p>}
          </div>

          {/* ColorHex */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
              Цвет (HEX)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                {...register('colorHex')}
                type="color"
                style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', cursor: 'pointer', border: '1px solid var(--border-default)', background: 'transparent' }}
              />
              <input {...register('colorHex')} className="input-field font-mono" style={{ flex: 1 }} placeholder="#ffffff" />
            </div>
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
              Описание
            </label>
            <textarea
              {...register('description')}
              rows={2}
              className="input-field"
              style={{ resize: 'none' }}
              placeholder="Описание товара..."
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
            {!isNew && (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 'var(--radius-lg)',
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: 'var(--text-sm)', color: 'var(--danger-fg)',
                  transition: 'background var(--dur-fast)',
                }}
              >
                <Trash size={15} />
                Удалить
              </button>
            )}
            <div style={{ display: 'flex', gap: 8, marginLeft: isNew ? 'auto' : 0 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-default)',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
                }}
              >
                Отмена
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-lg)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 'var(--text-sm)', fontWeight: 500,
                  background: 'var(--action-primary-bg)',
                  color: 'var(--action-primary-fg)',
                  transition: 'background var(--dur-fast)',
                }}
              >
                {isNew ? 'Создать' : 'Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── ProductsDesktop ───────────────────────────────────────────────────────────
export function ProductsDesktop() {
  const { products, fetch: fetchProducts } = useProductStore()
  const { getStock, fetchStock }  = useStockStore()

  useEffect(() => {
    fetchProducts()
    fetchStock()
  }, [])

  const [search, setSearch]           = useState('')
  const [sizeFilter, setSizeFilter]   = useState('')
  const [editTarget, setEditTarget]   = useState<null | 'new' | Product>(null)

  const uniqueSizes = [...new Set(products.map((p) => p.size))].sort()

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.article.toLowerCase().includes(q)
    const matchSize   = !sizeFilter || p.size === sizeFilter
    return matchSearch && matchSize
  })

  const hasFilters = search !== '' || sizeFilter !== ''

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  function stockChipStyle(stock: number) {
    if (stock === 0)  return { color: 'var(--danger-fg)',  background: 'var(--danger-bg)',  border: '1px solid var(--danger-border)'  }
    if (stock < 10)   return { color: 'var(--warning-fg)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }
    return               { color: 'var(--success-fg)', background: 'var(--success-bg)', border: '1px solid var(--success-border)' }
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: 'var(--tracking-tight)' }}>Каталог товаров</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>{products.length} позиций</p>
        </div>
        <button
          onClick={() => setEditTarget('new')}
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
          Добавить товар
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <MagnifyingGlass
            size={14}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или артикулу..."
            style={{
              width: '100%', height: 38,
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

        <select
          value={sizeFilter}
          onChange={(e) => setSizeFilter(e.target.value)}
          style={{
            height: 38,
            padding: '0 12px',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            background: 'var(--surface-sunken)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">Все размеры</option>
          {uniqueSizes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setSizeFilter('') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              background: 'transparent', cursor: 'pointer',
              fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
            }}
          >
            <X size={14} />
            Сбросить
          </button>
        )}
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
              {['Фото', 'Название', 'Артикул', 'Размер', 'Цвет', 'Остаток', 'Дата', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-caps)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                  Товары не найдены
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const stock = getStock(p.id)
                const chipStyle = stockChipStyle(stock)

                return (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    className="bof-table-row"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-hover)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <ProductAvatar photo={p.photo} name={p.name} className="w-10 h-10 rounded-xl flex-shrink-0" />
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{p.article}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{p.size}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid var(--border-default)', flexShrink: 0, background: p.colorHex }}
                        />
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{p.color}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        padding: '2px 8px', borderRadius: 6,
                        ...chipStyle,
                      }}>
                        {stock} шт
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{formatDate(p.createdAt)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => setEditTarget(p)}
                          style={{
                            width: 28, height: 28,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 'var(--radius-md)',
                            border: 'none', background: 'transparent', cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Удалить товар "${p.name}"?`)) {
                              useProductStore.getState().remove(p.id)
                            }
                          }}
                          style={{
                            width: 28, height: 28,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 'var(--radius-md)',
                            border: 'none', background: 'transparent', cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {editTarget !== null && (
        <ProductModal target={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </div>
  )
}
