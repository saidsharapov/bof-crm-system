import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trash, Image, WarningCircle } from '@phosphor-icons/react'
import type { Product } from '@/store/productStore'
import { ProductAvatar } from './ProductAvatar'

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  name:        z.string().min(1, 'Введите название').max(100),
  article:     z.string().min(1, 'Введите артикул').max(50),
  size:        z.string().min(1, 'Выберите размер'),
  color:       z.string().min(1, 'Введите цвет'),
  colorHex:    z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Неверный HEX'),
  description: z.string().max(500),
  photo:       z.string().max(5_000_000),
})
type FormData = z.infer<typeof schema>

// ── Constants ─────────────────────────────────────────────────────────────────
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

const PRESET_COLORS = [
  { name: 'Белый',        hex: '#FFFFFF' },
  { name: 'Чёрный',       hex: '#1a1a1a' },
  { name: 'Серый',        hex: '#9ca3af' },
  { name: 'Тёмно-синий',  hex: '#1e3a5f' },
  { name: 'Красный',      hex: '#ef4444' },
  { name: 'Зелёный',      hex: '#22c55e' },
  { name: 'Жёлтый',       hex: '#eab308' },
  { name: 'Бежевый',      hex: '#d4b896' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className="m-label">{label}</label>
      {children}
      {error && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--danger-fg)', margin: 0 }}>
          <WarningCircle size={12} weight="fill" /> {error}
        </p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface ProductFormProps {
  initial?: Product
  onSave: (data: FormData) => void
  onDelete?: () => void
  onCancel: () => void
}

export function ProductForm({ initial, onSave, onDelete, onCancel }: ProductFormProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(initial?.photo ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        initial?.name        ?? '',
      article:     initial?.article     ?? '',
      size:        initial?.size        ?? '',
      color:       initial?.color       ?? '',
      colorHex:    initial?.colorHex    ?? '#FFFFFF',
      description: initial?.description ?? '',
      photo:       initial?.photo       ?? '',
    },
  })

  const watchedPhoto = watch('photo')
  useEffect(() => { setPreview(watchedPhoto) }, [watchedPhoto])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = reader.result as string
      setValue('photo', b64, { shouldValidate: true })
    }
    reader.readAsDataURL(file)
  }

  function pickColor(c: { name: string; hex: string }) {
    setValue('color', c.name, { shouldValidate: true })
    setValue('colorHex', c.hex, { shouldValidate: true })
  }

  const selectedSize = watch('size')
  const colorHex     = watch('colorHex')

  return (
    <form onSubmit={handleSubmit(onSave)} style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Photo section */}
      <Field label="Фото" error={errors.photo?.message}>
        <div
          style={{
            position: 'relative', width: '100%', height: 160, borderRadius: 'var(--radius-2xl)',
            overflow: 'hidden', cursor: 'pointer',
            border: '1px solid var(--border-default)',
            transition: 'border-color var(--dur-fast)',
          }}
          onClick={() => fileRef.current?.click()}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        >
          <ProductAvatar photo={preview} name={watch('name') || 'Товар'} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity var(--dur-fast)',
          }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
          >
            <Image size={28} style={{ color: 'rgba(255,255,255,0.7)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Загрузить фото</span>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        <input
          {...register('photo')}
          type="url"
          placeholder="или вставьте URL фото…"
          style={{
            width: '100%', background: 'var(--surface-sunken)',
            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)',
            padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)',
            outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-sans)',
          }}
        />
      </Field>

      {/* Name */}
      <Field label="Название" error={errors.name?.message}>
        <input {...register('name')} placeholder="Футболка базовая" className="input-field" />
      </Field>

      {/* Article */}
      <Field label="Артикул" error={errors.article?.message}>
        <input {...register('article')} placeholder="FBZ-M-WHT" className="input-field" />
      </Field>

      {/* Size chips */}
      <Field label="Размер" error={errors.size?.message}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SIZES.map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => setValue('size', sz, { shouldValidate: true })}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-lg)',
                border: `1px solid ${selectedSize === sz ? '#5b6ef5' : 'var(--border-default)'}`,
                background: selectedSize === sz ? '#5b6ef5' : 'var(--surface-sunken)',
                color: selectedSize === sz ? '#fff' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all var(--dur-fast)',
              }}
            >
              {sz}
            </button>
          ))}
          {/* Custom size */}
          <input
            {...register('size')}
            placeholder="Другой…"
            style={{
              flex: 1, minWidth: 80, background: 'var(--surface-sunken)',
              border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)',
              padding: '6px 12px', fontSize: 12, color: 'var(--text-primary)',
              outline: 'none', fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
      </Field>

      {/* Color */}
      <Field label="Цвет" error={errors.color?.message}>
        {/* Preset swatches */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => pickColor(c)}
              title={c.name}
              style={{
                width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                backgroundColor: c.hex,
                border: `2px solid ${colorHex === c.hex ? '#5b6ef5' : 'var(--border-default)'}`,
                transform: colorHex === c.hex ? 'scale(1.1)' : 'scale(1)',
                boxShadow: colorHex === c.hex ? '0 0 8px rgba(91,110,245,0.5)' : 'none',
                transition: 'all var(--dur-fast)',
              }}
            />
          ))}
        </div>
        {/* Custom name + hex */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            {...register('color')}
            placeholder="Название цвета"
            className="input-field"
            style={{ flex: 1 }}
          />
          <label
            style={{
              width: 44, height: 44, borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-default)', overflow: 'hidden',
              cursor: 'pointer', position: 'relative', flexShrink: 0,
            }}
            title="Выбрать HEX"
          >
            <div style={{ position: 'absolute', inset: 0, backgroundColor: colorHex }} />
            <input type="color" {...register('colorHex')} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
          </label>
        </div>
      </Field>

      {/* Description */}
      <Field label="Описание" error={errors.description?.message}>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Материал, особенности…"
          className="input-field"
          style={{ resize: 'none', padding: '12px 14px' }}
        />
      </Field>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-default)', background: 'none',
            fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer',
            transition: 'all var(--dur-fast)',
          }}
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 'var(--radius-xl)',
            border: 'none', background: '#5b6ef5', color: '#fff',
            fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
            opacity: isSubmitting ? 0.5 : 1,
            transition: 'opacity var(--dur-fast)',
          }}
        >
          {initial ? 'Сохранить' : 'Создать'}
        </button>
      </div>

      {/* Delete */}
      {onDelete && (
        <div style={{ paddingTop: 4 }}>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 'var(--radius-xl)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-sm)', color: 'var(--danger-fg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Trash size={15} weight="duotone" />
              Удалить товар
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-subtle)', background: 'none',
                  fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', cursor: 'pointer',
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={onDelete}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 'var(--radius-xl)',
                  border: 'none', background: 'var(--danger-solid)', color: '#fff',
                  fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Удалить навсегда
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
