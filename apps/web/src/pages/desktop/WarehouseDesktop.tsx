import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowSquareIn, ArrowSquareOut, X, Plus, Pencil, Trash } from '@phosphor-icons/react'
import { useProductStore } from '@/store/productStore'
import { useStockStore }   from '@/store/stockStore'
import { useMaterialStore, type Material, type MaterialUnit } from '@/store/materialStore'
import { useAuthStore }    from '@/store/authStore'
import { ProductAvatar }   from '@/components/products/ProductAvatar'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// ── Shared table styles ───────────────────────────────────────────────────────
const tableCard: React.CSSProperties = {
  background: 'var(--surface-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-2xl)',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
}
const theadRow: React.CSSProperties = { background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }
const th: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }
const tdRow: React.CSSProperties = { borderBottom: '1px solid var(--border-subtle)' }

function stockChip(n: number, unit = 'шт') {
  const s = n === 0
    ? { color: 'var(--danger-fg)',  background: 'var(--danger-bg)',  border: '1px solid var(--danger-border)' }
    : n <= 10
    ? { color: 'var(--warning-fg)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }
    : { color: 'var(--success-fg)', background: 'var(--success-bg)', border: '1px solid var(--success-border)' }
  return { style: s, label: n === 0 ? 'Нет' : n <= 10 ? 'Мало' : 'В наличии', qty: `${n} ${unit}` }
}

const inputSt: React.CSSProperties = {
  width: '100%', height: 38, padding: '0 12px',
  background: 'var(--surface-sunken)', border: '1px solid var(--border-default)',
  borderRadius: 10, fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
}

// ── Material IN/OUT Drawer ────────────────────────────────────────────────────
interface MoveDrawerProps {
  materialId: string
  mode: 'IN' | 'OUT'
  onClose: () => void
}
function MaterialMoveDrawer({ materialId, mode, onClose }: MoveDrawerProps) {
  const { materials, addMovement, getStock } = useMaterialStore()
  const { user } = useAuthStore()
  const mat = materials.find(m => m.id === materialId)
  const stock = getStock(materialId)
  const isIN = mode === 'IN'

  const [qty, setQty]         = useState('')
  const [comment, setComment] = useState('')
  const [source, setSource]   = useState('')
  const [reason, setReason]   = useState('delivery')
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)

  function submit() {
    const n = parseFloat(qty)
    if (!n || n <= 0) { setError('Введите количество'); return }
    if (!isIN && n > stock) { setError(`На складе только ${stock} ${mat?.unit}`); return }
    addMovement(materialId, mode, n, comment || (isIN ? source : reason), user?.name ?? 'Пользователь')
    setDone(true)
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', zIndex: 100 }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: 'var(--surface-card)', borderLeft: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-xl)', zIndex: 101,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: isIN ? 'var(--success-bg)' : 'var(--danger-bg)',
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isIN ? 'Приход сырья' : 'Расход сырья'}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {mat?.name}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--radius-lg)', border: 'none', background: 'transparent',
            cursor: 'pointer', color: 'var(--text-tertiary)',
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {done ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: isIN ? 'var(--success-bg)' : 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isIN ? 'var(--success-fg)' : 'var(--danger-fg)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {isIN ? 'Приход оформлен' : 'Расход оформлен'}
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>
                {isIN ? '+' : '−'}{qty} {mat?.unit} · {mat?.name}
              </p>
              <button onClick={onClose} style={{
                marginTop: 8, padding: '9px 24px', borderRadius: 'var(--radius-lg)',
                border: 'none', background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)',
                fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}>Закрыть</button>
            </div>
          ) : (
            <>
              {/* Текущий остаток */}
              <div style={{ padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Текущий остаток</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-md)', color: stock === 0 ? 'var(--danger-fg)' : 'var(--text-primary)' }}>
                  {stock} {mat?.unit}
                </span>
              </div>

              {/* Количество */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Количество ({mat?.unit}) <span style={{ color: 'var(--danger-fg)' }}>*</span>
                </label>
                <input
                  type="text" inputMode="decimal"
                  value={qty}
                  onChange={e => {
                    let s = e.target.value.replace(/[^0-9.]/g, '')
                    const dot = s.indexOf('.')
                    if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '')
                    s = s.replace(/^0+([1-9])/, '$1')
                    setQty(s)
                    setError('')
                  }}
                  style={inputSt} placeholder="0"
                  autoFocus
                />
                {/* Быстрые кнопки */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {[1, 5, 10, 25, 50].map(n => (
                    <button key={n} type="button"
                      disabled={!isIN && n > stock}
                      onClick={() => { setQty(String(n)); setError('') }}
                      style={{
                        flex: 1, height: 30, borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)', background: 'var(--surface-sunken)',
                        cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600,
                        color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                        opacity: (!isIN && n > stock) ? 0.3 : 1,
                      }}>
                      {n}
                    </button>
                  ))}
                </div>
                {/* Остаток после */}
                {qty && parseFloat(qty) > 0 && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 6 }}>
                    Остаток после: <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: (!isIN && stock - parseFloat(qty) < 0) ? 'var(--danger-fg)' : 'var(--text-primary)' }}>
                      {isIN ? stock + parseFloat(qty) : stock - parseFloat(qty)} {mat?.unit}
                    </span>
                  </p>
                )}
                {error && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-fg)', marginTop: 4 }}>{error}</p>
                )}
              </div>

              {/* Поставщик (IN) / Причина (OUT) */}
              {isIN ? (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Поставщик
                  </label>
                  <input type="text" value={source} onChange={e => setSource(e.target.value)}
                    style={inputSt} placeholder="Название поставщика" />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Причина
                  </label>
                  <select value={reason} onChange={e => setReason(e.target.value)} style={inputSt}>
                    <option value="delivery">Передача в производство</option>
                    <option value="defect">Брак / списание</option>
                    <option value="reserve">Резерв</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
              )}

              {/* Комментарий */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Комментарий
                </label>
                <textarea
                  value={comment} onChange={e => setComment(e.target.value)}
                  rows={2} style={{ ...inputSt, height: 'auto', padding: '10px 12px', resize: 'none' }}
                  placeholder="Необязательно"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              flex: 1, height: 40, borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)', background: 'transparent',
              cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 500,
              color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)',
            }}>Отмена</button>
            <button onClick={submit} style={{
              flex: 2, height: 40, borderRadius: 'var(--radius-lg)',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              background: isIN ? 'var(--success-solid)' : 'var(--danger-solid)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {isIN ? <ArrowSquareIn size={16} /> : <ArrowSquareOut size={16} />}
              {isIN ? 'Оприходовать' : 'Списать'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Material CRUD Drawer ──────────────────────────────────────────────────────
interface MatFormDrawerProps {
  target: 'new' | Material
  onClose: () => void
}
function MaterialFormDrawer({ target, onClose }: MatFormDrawerProps) {
  const { addMaterial, updateMaterial, removeMaterial } = useMaterialStore()
  const isNew = target === 'new'
  const existing = isNew ? null : target as Material

  const [name, setName]   = useState(existing?.name ?? '')
  const [unit, setUnit]   = useState<MaterialUnit>(existing?.unit ?? 'кг')
  const [desc, setDesc]   = useState(existing?.description ?? '')
  const [err, setErr]     = useState('')

  function submit() {
    if (!name.trim()) { setErr('Введите название'); return }
    if (isNew) { addMaterial({ name: name.trim(), unit, description: desc }) }
    else { updateMaterial(existing!.id, { name: name.trim(), unit, description: desc }) }
    onClose()
  }

  function handleDelete() {
    if (!existing) return
    if (window.confirm(`Удалить материал "${existing.name}"?`)) {
      removeMaterial(existing.id)
      onClose()
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', zIndex: 100 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 400,
        background: 'var(--surface-card)', borderLeft: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-xl)', zIndex: 101,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ margin: 0, flex: 1, fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isNew ? 'Новый материал' : 'Редактировать'}
          </h3>
          {!isNew && (
            <button onClick={handleDelete} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger-fg)' }}>
              <Trash size={16} />
            </button>
          )}
          <button onClick={onClose} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>
              Название <span style={{ color: 'var(--danger-fg)' }}>*</span>
            </label>
            <input value={name} onChange={e => { setName(e.target.value); setErr('') }}
              style={inputSt} placeholder="Ткань хлопок" autoFocus />
            {err && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-fg)', marginTop: 4 }}>{err}</p>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>
              Единица измерения
            </label>
            <select value={unit} onChange={e => setUnit(e.target.value as MaterialUnit)} style={inputSt}>
              <option value="кг">кг</option>
              <option value="м">м</option>
              <option value="шт">шт</option>
              <option value="рулон">рулон</option>
              <option value="катушка">катушка</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>
              Описание
            </label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              rows={3} style={{ ...inputSt, height: 'auto', padding: '10px 12px', resize: 'none' }}
              placeholder="Характеристики материала" />
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, height: 40, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', background: 'transparent', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
            Отмена
          </button>
          <button onClick={submit} style={{ flex: 2, height: 40, borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600, background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)', fontFamily: 'var(--font-sans)' }}>
            {isNew ? 'Добавить' : 'Сохранить'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Tab button ────────────────────────────────────────────────────────────────
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 18px', borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: active ? 600 : 500,
        background: active ? 'var(--surface-card)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
        boxShadow: active ? 'var(--shadow-xs)' : 'none',
        transition: 'all 0.13s',
        position: 'relative' as const,
      }}
    >
      {active && (
        <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, borderRadius: 2, background: 'var(--accent)' }} />
      )}
      {children}
    </button>
  )
}

// ── Товары tab ────────────────────────────────────────────────────────────────
function ProductsTab() {
  const navigate = useNavigate()
  const { products } = useProductStore()
  const { movements, getStock } = useStockStore()

  const stockMap: Record<string, number> = {}
  for (const p of products) stockMap[p.id] = getStock(p.id)

  const inStockCount  = products.filter(p => stockMap[p.id] > 10).length
  const lowStockCount = products.filter(p => stockMap[p.id] > 0 && stockMap[p.id] <= 10).length
  const emptyCount    = products.filter(p => stockMap[p.id] === 0).length
  const productMap: Record<string, string> = {}
  for (const p of products) productMap[p.id] = p.name

  const recentMovements = [...movements]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: 16 }}>
        {[
          { label: 'В наличии', color: 'var(--success-fg)', val: inStockCount, sub: 'позиций более 10 шт' },
          { label: 'Мало',      color: 'var(--warning-fg)', val: lowStockCount, sub: 'позиций 1–10 шт'    },
          { label: 'Нет',       color: 'var(--danger-fg)',  val: emptyCount,    sub: 'позиций нет'         },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-sm)', padding: 20 }}>
            <p style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: s.color, margin: 0 }}>{s.label}</p>
            <p style={{ fontSize: 'var(--text-5xl)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)', margin: '8px 0 0', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{s.val}</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: '8px 0 0' }}>{s.sub}</p>
          </div>
        ))}
        {/* Кнопки действий */}
        <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-2xl)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => navigate('/warehouse/receipt')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600, fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
            <ArrowSquareIn size={16} /> Оформить приход
          </button>
          <button onClick={() => navigate('/warehouse/expense')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 500, fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
            <ArrowSquareOut size={16} /> Оформить расход
          </button>
        </div>
      </div>

      {/* Products table */}
      <div>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-tertiary)', margin: '0 0 12px' }}>Остатки на складе</h3>
        <div style={tableCard}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={theadRow}>
                {['Товар', 'Артикул', 'Размер', 'Цвет', 'Остаток', 'Статус', ''].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Нет товаров</td></tr>
              ) : products.map(p => {
                const stock = stockMap[p.id]
                const chip = stockChip(stock)
                return (
                  <tr key={p.id} style={tdRow}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-hover)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ProductAvatar photo={p.photo} name={p.name} className="w-8 h-8 rounded-lg flex-shrink-0" />
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{p.article}</span></td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{p.size}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid var(--border-default)', background: p.colorHex }} />
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{p.color}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)', ...chip.style }}>{chip.qty}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, ...chip.style }}>{chip.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => navigate('/warehouse/receipt')} title="Приход" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--success-fg)' }}><ArrowSquareIn size={16} /></button>
                        <button onClick={() => navigate('/warehouse/expense')} title="Расход" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger-fg)' }}><ArrowSquareOut size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movements history */}
      <div>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-tertiary)', margin: '0 0 12px' }}>
          История движений <span style={{ color: 'var(--text-disabled)', fontWeight: 400 }}>(последние {recentMovements.length})</span>
        </h3>
        <div style={tableCard}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={theadRow}>{['Дата', 'Тип', 'Товар', 'Кол-во', 'Комментарий', 'Сотрудник'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {recentMovements.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Движений нет</td></tr>
              ) : recentMovements.map(mv => (
                <tr key={mv.id} style={tdRow}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-hover)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}>
                  <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{formatDateTime(mv.createdAt)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, ...(mv.type === 'IN' ? { color: 'var(--success-fg)', background: 'var(--success-bg)', border: '1px solid var(--success-border)' } : { color: 'var(--danger-fg)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }) }}>
                      {mv.type === 'IN' ? 'Приход' : 'Расход'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>{productMap[mv.productId] ?? mv.productId}</td>
                  <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{mv.qty} шт</td>
                  <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{mv.comment || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{mv.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Сырьё tab ─────────────────────────────────────────────────────────────────
function MaterialsTab() {
  const { materials, movements, getStock } = useMaterialStore()

  const [moveDrawer, setMoveDrawer] = useState<{ materialId: string; mode: 'IN' | 'OUT' } | null>(null)
  const [formDrawer, setFormDrawer] = useState<'new' | Material | null>(null)

  const stockMap: Record<string, number> = {}
  for (const m of materials) stockMap[m.id] = getStock(m.id)

  const inStock  = materials.filter(m => stockMap[m.id] > 10).length
  const lowStock = materials.filter(m => stockMap[m.id] > 0 && stockMap[m.id] <= 10).length
  const empty    = materials.filter(m => stockMap[m.id] === 0).length

  const matMap: Record<string, string> = {}
  for (const m of materials) matMap[m.id] = m.name

  const recentMov = [...movements]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: 16 }}>
        {[
          { label: 'В наличии', color: 'var(--success-fg)', val: inStock,  sub: 'материалов достаточно' },
          { label: 'Мало',      color: 'var(--warning-fg)', val: lowStock, sub: 'материалов мало'        },
          { label: 'Нет',       color: 'var(--danger-fg)',  val: empty,    sub: 'материалов нет'         },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-sm)', padding: 20 }}>
            <p style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: s.color, margin: 0 }}>{s.label}</p>
            <p style={{ fontSize: 'var(--text-5xl)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)', margin: '8px 0 0', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{s.val}</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: '8px 0 0' }}>{s.sub}</p>
          </div>
        ))}
        {/* Кнопка добавить */}
        <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-2xl)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => setFormDrawer('new')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600, fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
            <Plus size={16} /> Новый материал
          </button>
        </div>
      </div>

      {/* Materials table */}
      <div>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-tertiary)', margin: '0 0 12px' }}>Остатки сырья</h3>
        <div style={tableCard}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={theadRow}>
                {['Материал', 'Описание', 'Ед.', 'Остаток', 'Статус', ''].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Нет материалов</td></tr>
              ) : materials.map(m => {
                const stock = stockMap[m.id]
                const chip = stockChip(stock, m.unit)
                return (
                  <tr key={m.id} style={tdRow}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-hover)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                        </div>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{m.description || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{m.unit}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)', ...chip.style }}>{chip.qty}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, ...chip.style }}>{chip.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setMoveDrawer({ materialId: m.id, mode: 'IN' })} title="Приход" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--success-fg)' }}><ArrowSquareIn size={16} /></button>
                        <button onClick={() => setMoveDrawer({ materialId: m.id, mode: 'OUT' })} title="Расход" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger-fg)' }}><ArrowSquareOut size={16} /></button>
                        <button onClick={() => setFormDrawer(m)} title="Редактировать" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}><Pencil size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material movements history */}
      <div>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-tertiary)', margin: '0 0 12px' }}>
          История движений сырья <span style={{ color: 'var(--text-disabled)', fontWeight: 400 }}>(последние {recentMov.length})</span>
        </h3>
        <div style={tableCard}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={theadRow}>{['Дата', 'Тип', 'Материал', 'Кол-во', 'Комментарий', 'Сотрудник'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {recentMov.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Движений нет</td></tr>
              ) : recentMov.map(mv => {
                const mat = materials.find(m => m.id === mv.materialId)
                return (
                  <tr key={mv.id} style={tdRow}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-hover)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{formatDateTime(mv.createdAt)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, ...(mv.type === 'IN' ? { color: 'var(--success-fg)', background: 'var(--success-bg)', border: '1px solid var(--success-border)' } : { color: 'var(--danger-fg)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }) }}>
                        {mv.type === 'IN' ? 'Приход' : 'Расход'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>{matMap[mv.materialId] ?? mv.materialId}</td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', fontWeight: 600, color: mv.type === 'IN' ? 'var(--success-fg)' : 'var(--danger-fg)' }}>
                      {mv.type === 'IN' ? '+' : '−'}{mv.qty} {mat?.unit ?? ''}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{mv.comment || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{mv.actor}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawers */}
      {moveDrawer && (
        <MaterialMoveDrawer
          materialId={moveDrawer.materialId}
          mode={moveDrawer.mode}
          onClose={() => setMoveDrawer(null)}
        />
      )}
      {formDrawer !== null && (
        <MaterialFormDrawer
          target={formDrawer}
          onClose={() => setFormDrawer(null)}
        />
      )}
    </div>
  )
}

// ── WarehouseDesktop ──────────────────────────────────────────────────────────
export function WarehouseDesktop() {
  const [tab, setTab] = useState<'products' | 'materials'>('products')

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tab strip */}
      <div style={{
        display: 'inline-flex', gap: 4, padding: 4,
        background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)', alignSelf: 'flex-start',
      }}>
        <Tab active={tab === 'products'}  onClick={() => setTab('products')}>Готовая продукция</Tab>
        <Tab active={tab === 'materials'} onClick={() => setTab('materials')}>Сырьё</Tab>
      </div>

      {tab === 'products'  && <ProductsTab />}
      {tab === 'materials' && <MaterialsTab />}
    </div>
  )
}
