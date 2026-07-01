import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import clsx from 'clsx'
import {
  Lock, Eye, EyeSlash, Sun, Moon, CheckCircle, WarningCircle,
  Pencil, Trash, Plus, X, Archive, ArrowCounterClockwise,
  Crown, Package as PackageIcon, ShieldStar,
  User, ShieldCheck, Palette, UsersThree, Info, Tag,
} from '@phosphor-icons/react'
import { useAuthStore, type UserRole } from '@/store/authStore'
import { useThemeStore }               from '@/store/themeStore'
import { useUserManagementStore, type AppUser } from '@/store/userManagementStore'
import { useOrderSourceStore, type OrderSource } from '@/store/orderSourceStore'
import { usersApi } from '@/api/users'

// ── Role meta ─────────────────────────────────────────────────────────────────
const ROLE_META: Record<UserRole, { label: string; icon: React.ElementType; chip: React.CSSProperties }> = {
  ADMIN:     { label: 'Администратор', icon: Crown,       chip: { color: 'var(--warning-fg)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' } },
  MANAGER:   { label: 'Менеджер',      icon: PackageIcon, chip: { color: 'var(--info-fg)',    background: 'var(--info-bg)',    border: '1px solid var(--info-border)'    } },
  WAREHOUSE: { label: 'Кладовщик',     icon: ShieldStar,  chip: { color: 'var(--success-fg)', background: 'var(--success-bg)', border: '1px solid var(--success-border)' } },
}

// ── Tab types ─────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'security' | 'appearance' | 'users' | 'sources' | 'about'

const TABS_BASE: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',    label: 'Профиль',     icon: User       },
  { id: 'security',   label: 'Безопасность', icon: ShieldCheck },
  { id: 'appearance', label: 'Внешний вид',  icon: Palette    },
  { id: 'about',      label: 'О системе',    icon: Info       },
]
const USERS_TAB   = { id: 'users'   as Tab, label: 'Пользователи',      icon: UsersThree }
const SOURCES_TAB = { id: 'sources' as Tab, label: 'Источники заказов', icon: Tag        }

// ── Field helper ──────────────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>{label}</label>
      {children}
      {error && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--danger-fg)', margin: 0 }}>
          <WarningCircle size={11} weight="fill" />
          {error}
        </p>
      )}
    </div>
  )
}

// ── Password input ────────────────────────────────────────────────────────────
function PasswordInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className="input-field"
        style={{ paddingLeft: 36, paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setShow((p) => !p)}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
        tabIndex={-1}
      >
        {show ? <EyeSlash size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

// ── Password schema ───────────────────────────────────────────────────────────
const pwSchema = z
  .object({
    current: z.string().min(1, 'Введите текущий пароль'),
    next:    z.string().min(4, 'Минимум 4 символа').max(64),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { path: ['confirm'], message: 'Пароли не совпадают' })
type PwForm = z.infer<typeof pwSchema>

// ── User schema ───────────────────────────────────────────────────────────────
const userSchema = z.object({
  name:     z.string().min(1, 'Введите имя'),
  login:    z.string().min(3, 'Мин. 3 символа').max(32).regex(/^\S+$/, 'Без пробелов'),
  role:     z.enum(['ADMIN', 'MANAGER', 'WAREHOUSE']),
  password: z.string(),
  active:   z.boolean(),
})
type UserFormData = z.infer<typeof userSchema>

// ── User modal ────────────────────────────────────────────────────────────────
function UserModal({
  initial,
  onClose,
}: {
  initial?: AppUser
  onClose: () => void
}) {
  const { addUser, updateUser, removeUser } = useUserManagementStore()
  const [confirmDel, setConfirmDel]         = useState(false)

  const isNew = !initial

  const { register, handleSubmit, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(
      isNew ? userSchema.extend({ password: z.string().min(4, 'Мин. 4 символа') }) : userSchema,
    ),
    defaultValues: {
      name:     initial?.name  ?? '',
      login:    initial?.login ?? '',
      role:     initial?.role  ?? 'MANAGER',
      password: '',
      active:   initial?.active ?? true,
    },
  })

  function onSubmit(data: UserFormData) {
    if (initial) {
      updateUser(initial.id, {
        name:   data.name,
        login:  data.login,
        role:   data.role,
        active: data.active,
        ...(data.password ? { password: data.password } : {}),
      })
    } else {
      addUser({ name: data.name, login: data.login, role: data.role, password: data.password, active: true })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'var(--scrim)' }} onClick={onClose} />
      <div
        className="relative animate-fade-up"
        style={{
          background: 'var(--surface-overlay)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: '0 12px 24px rgba(16,18,27,0.15)',
          width: 480,
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {isNew ? 'Новый пользователь' : 'Редактировать пользователя'}
          </h2>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Полное имя" error={errors.name?.message}>
            <input {...register('name')} placeholder="Иван Иванов" className="input-field" />
          </Field>
          <Field label="Логин" error={errors.login?.message}>
            <input {...register('login')} placeholder="ivan.ivanov" className="input-field" autoCapitalize="none" />
          </Field>
          <Field
            label={initial ? 'Новый пароль (оставьте пустым)' : 'Пароль'}
            error={errors.password?.message}
          >
            <PasswordInput {...register('password')} placeholder={initial ? 'не менять' : 'Пароль'} />
          </Field>

          <Field label="Роль" error={errors.role?.message}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(['ADMIN', 'MANAGER', 'WAREHOUSE'] as UserRole[]).map((r) => {
                const meta = ROLE_META[r]
                const Icon = meta.icon
                return (
                  <label key={r} style={{ cursor: 'pointer' }}>
                    <input type="radio" {...register('role')} value={r} className="sr-only peer" />
                    <div className={clsx(
                      'flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all',
                      'border-border-subtle-ds text-txt-tertiary',
                      'peer-checked:border-[var(--accent-border)] peer-checked:bg-[var(--accent-soft)] peer-checked:text-txt-primary',
                    )}>
                      <Icon size={18} weight="duotone" />
                      <span style={{ fontSize: 10, fontWeight: 500, lineHeight: 1.2 }}>{meta.label}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </Field>

          {initial && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Активен</span>
              <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" {...register('active')} className="sr-only peer" />
                <div style={{ width: 40, height: 24, borderRadius: 9999, background: 'var(--surface-sunken)', border: '1px solid var(--border-default)', position: 'relative', transition: 'background var(--dur-fast)' }}
                  className="peer-checked:bg-[var(--action-primary-bg)]"
                >
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </div>
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', background: 'transparent', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}
            >
              Отмена
            </button>
            <button
              type="submit"
              style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600, background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)' }}
            >
              {isNew ? 'Создать' : 'Сохранить'}
            </button>
          </div>

          {initial && (
            !confirmDel ? (
              <button
                type="button"
                onClick={() => setConfirmDel(true)}
                style={{ width: '100%', padding: '10px 0', fontSize: 'var(--text-sm)', color: 'var(--danger-fg)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Trash size={14} />
                Удалить пользователя
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setConfirmDel(false)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', background: 'transparent', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}
                >
                  Нет
                </button>
                <button
                  type="button"
                  onClick={() => { removeUser(initial.id); onClose() }}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600, background: 'var(--danger-solid)', color: '#fff' }}
                >
                  Да, удалить
                </button>
              </div>
            )
          )}
        </form>
      </div>
    </div>
  )
}

// ── Profile pane ──────────────────────────────────────────────────────────────
function ProfilePane() {
  const { user } = useAuthStore()
  if (!user) return null

  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const meta = ROLE_META[user.role]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 0' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--action-primary-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--action-primary-fg)',
          fontSize: 24, fontWeight: 700,
        }}>
          {initials}
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{user.name}</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>@{user.login}</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--radius-lg)', ...meta.chip }}>
          {meta.label}
        </span>
      </div>

      {/* Info rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[
          { label: 'Имя', value: user.name },
          { label: 'Логин', value: `@${user.login}` },
          { label: 'Роль', value: meta.label },
        ].map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 'var(--radius-xl)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-hover)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '' }}
          >
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{row.label}</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Security pane ─────────────────────────────────────────────────────────────
function SecurityPane() {
  const [ok, setOk] = useState(false)

  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  })

  async function onSubmit(data: PwForm) {
    try {
      await usersApi.changePassword(data.current, data.next)
      setOk(true)
      reset()
      setTimeout(() => setOk(false), 3000)
    } catch {
      setError('current', { message: 'Неверный текущий пароль' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 384 }}>
      <h3 style={{ fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', margin: 0 }}>Смена пароля</h3>
      {ok && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 'var(--radius-xl)', background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
          <CheckCircle size={16} weight="fill" style={{ color: 'var(--success-fg)' }} />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--success-fg)', margin: 0 }}>Пароль успешно изменён</p>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Текущий пароль" error={errors.current?.message}>
          <PasswordInput {...register('current')} placeholder="••••••••" />
        </Field>
        <Field label="Новый пароль" error={errors.next?.message}>
          <PasswordInput {...register('next')} placeholder="Новый пароль" />
        </Field>
        <Field label="Повторите пароль" error={errors.confirm?.message}>
          <PasswordInput {...register('confirm')} placeholder="Повтор" />
        </Field>
        <button
          type="submit"
          style={{ width: '100%', padding: '10px 0', borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600, background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)' }}
        >
          Сменить пароль
        </button>
      </form>
    </div>
  )
}

// ── Appearance pane ───────────────────────────────────────────────────────────
function AppearancePane() {
  const { theme, toggle } = useThemeStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', margin: 0 }}>Тема оформления</h3>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-sunken)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {theme === 'dark'
            ? <Moon size={18} weight="duotone" style={{ color: 'var(--text-secondary)' }} />
            : <Sun  size={18} weight="duotone" style={{ color: 'var(--warning-fg)' }} />
          }
          <div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', margin: 0 }}>{theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
              {theme === 'dark' ? 'Переключиться на светлую' : 'Переключиться на тёмную'}
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          style={{
            padding: '6px 16px', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            background: 'var(--surface-card)', cursor: 'pointer',
            fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)',
          }}
        >
          Переключить
        </button>
      </div>
    </div>
  )
}

// ── Users pane ────────────────────────────────────────────────────────────────
function UsersPane() {
  const { users, fetch: fetchUsers } = useUserManagementStore()
  const { user: me }                 = useAuthStore()
  const [modalUser, setModalUser]    = useState<AppUser | 'new' | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', margin: 0 }}>
          Пользователи системы
        </h3>
        <button
          onClick={() => setModalUser('new')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 'var(--radius-lg)',
            border: 'none', cursor: 'pointer',
            fontSize: 'var(--text-sm)', fontWeight: 500,
            background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)',
          }}
        >
          <Plus size={14} />
          Добавить
        </button>
      </div>

      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
              {['Имя', 'Логин', 'Роль', 'Статус', ''].map((h) => (
                <th
                  key={h}
                  style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const meta    = ROLE_META[u.role]
              const initials = u.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
              const isMe    = me?.login === u.login
              return (
                <tr
                  key={u.id}
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-hover)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}
                >
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                        background: u.active ? 'var(--action-primary-bg)' : 'var(--surface-sunken)',
                        color: u.active ? 'var(--action-primary-fg)' : 'var(--text-tertiary)',
                      }}>
                        {initials}
                      </div>
                      <div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>{u.name}</p>
                        {isMe && (
                          <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
                            Это вы
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>@{u.login}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, ...meta.chip }}>
                      {meta.label}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                      ...(u.active
                        ? { color: 'var(--success-fg)', background: 'var(--success-bg)', border: '1px solid var(--success-border)' }
                        : { color: 'var(--text-tertiary)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }),
                    }}>
                      {u.active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <button
                      onClick={() => setModalUser(u)}
                      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                    >
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modalUser !== null && (
        <UserModal
          initial={modalUser === 'new' ? undefined : (modalUser as AppUser)}
          onClose={() => setModalUser(null)}
        />
      )}
    </div>
  )
}

// ── Sources pane ─────────────────────────────────────────────────────────────
function SourcesPane() {
  const { sources, addSource, updateSource, archiveSource, restoreSource, removeSource, fetch: fetchSources } = useOrderSourceStore()
  const [adding, setAdding]   = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    fetchSources()
  }, [])
  const [editId, setEditId]   = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const active   = sources.filter((s) => !s.archived)
  const archived = sources.filter((s) => s.archived)

  function handleAdd() {
    if (!newName.trim()) return
    addSource(newName)
    setNewName('')
    setAdding(false)
  }

  function startEdit(src: OrderSource) {
    setEditId(src.id)
    setEditName(src.name)
  }

  function saveEdit() {
    if (editId && editName.trim()) updateSource(editId, editName)
    setEditId(null)
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '11px 16px',
    borderBottom: '1px solid var(--border-subtle)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', margin: 0 }}>
          Источники заказов
        </h3>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 'var(--radius-lg)',
              border: 'none', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: 500,
              background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)',
            }}
          >
            <Plus size={14} />
            Добавить
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          padding: '12px 16px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
        }}>
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="Название источника"
            className="input-field"
            style={{ flex: 1 }}
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            style={{
              padding: '8px 14px', borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: 500,
              background: newName.trim() ? 'var(--action-primary-bg)' : 'var(--surface-sunken)',
              color: newName.trim() ? 'var(--action-primary-fg)' : 'var(--text-disabled)',
            }}
          >
            Сохранить
          </button>
          <button
            onClick={() => { setAdding(false); setNewName('') }}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Active sources table */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden' }}>
        {active.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
            Нет активных источников
          </div>
        ) : (
          active.map((src) => (
            <div key={src.id} style={rowStyle}>
              {editId === src.id ? (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null) }}
                    className="input-field"
                    style={{ flex: 1, height: 34 }}
                  />
                  <button onClick={saveEdit} style={{ padding: '5px 12px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 500, background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)' }}>
                    Сохранить
                  </button>
                  <button onClick={() => setEditId(null)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <Tag size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{src.name}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => startEdit(src)}
                      title="Редактировать"
                      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => archiveSource(src.id)}
                      title="Архивировать"
                      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--warning-fg)'; (e.currentTarget as HTMLElement).style.background = 'var(--warning-bg)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <Archive size={13} />
                    </button>
                    {confirmDel === src.id ? (
                      <>
                        <button onClick={() => { removeSource(src.id); setConfirmDel(null) }} style={{ padding: '4px 10px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'var(--danger-bg)', color: 'var(--danger-fg)' }}>Удалить</button>
                        <button onClick={() => setConfirmDel(null)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', cursor: 'pointer', fontSize: 12, background: 'transparent', color: 'var(--text-secondary)' }}>Отмена</button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDel(src.id)}
                        title="Удалить"
                        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--danger-fg)'; (e.currentTarget as HTMLElement).style.background = 'var(--danger-bg)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <Trash size={13} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Archived section */}
      {archived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived((p) => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8 }}
          >
            <Archive size={14} />
            {showArchived ? 'Скрыть' : 'Показать'} архивные ({archived.length})
          </button>

          {showArchived && (
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', opacity: 0.7 }}>
              {archived.map((src) => (
                <div key={src.id} style={rowStyle}>
                  <Tag size={15} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-disabled)', textDecoration: 'line-through' }}>{src.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-disabled)', padding: '2px 8px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>Архив</span>
                  <button
                    onClick={() => restoreSource(src.id)}
                    title="Восстановить"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: 'transparent', color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--success-fg)'; (e.currentTarget as HTMLElement).style.background = 'var(--success-bg)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <ArrowCounterClockwise size={12} />
                    Восстановить
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Удалить «${src.name}» навсегда?`)) removeSource(src.id) }}
                    style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--danger-fg)'; (e.currentTarget as HTMLElement).style.background = 'var(--danger-bg)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <Trash size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
        Архивированные источники не отображаются при создании заказа, но сохраняются в существующих заказах.
      </p>
    </div>
  )
}

// ── About pane ────────────────────────────────────────────────────────────────
function AboutPane() {
  const rows = [
    { label: 'Версия',    value: '1.0.0' },
    { label: 'Платформа', value: 'Web (Vite + React)' },
    { label: 'Дата сборки', value: '2026' },
    { label: 'Разработчик', value: 'BOF Team' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', margin: 0 }}>О системе</h3>
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 16px',
              borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{row.label}</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SettingsDesktop ───────────────────────────────────────────────────────────
export function SettingsDesktop() {
  const { user }          = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const tabs = user?.role === 'ADMIN'
    ? [...TABS_BASE.slice(0, 3), USERS_TAB, SOURCES_TAB, TABS_BASE[3]]
    : TABS_BASE

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)', margin: 0 }}>Настройки</h2>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Sub-nav */}
        <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none', cursor: 'pointer',
                  textAlign: 'left', width: '100%',
                  fontSize: 'var(--text-sm)', fontWeight: isActive ? 600 : 500,
                  background: isActive ? 'var(--surface-card)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: isActive ? 'var(--shadow-xs)' : 'none',
                  position: 'relative',
                  transition: 'background var(--dur-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-hover)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    left: -9, top: 6, bottom: 6,
                    width: 3, borderRadius: 3,
                    background: 'var(--accent)',
                  }} />
                )}
                <Icon size={17} weight="duotone" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-sm)',
          padding: 24,
        }}>
          {activeTab === 'profile'    && <ProfilePane />}
          {activeTab === 'security'   && <SecurityPane />}
          {activeTab === 'appearance' && <AppearancePane />}
          {activeTab === 'users'      && user?.role === 'ADMIN' && <UsersPane />}
          {activeTab === 'sources'    && user?.role === 'ADMIN' && <SourcesPane />}
          {activeTab === 'about'      && <AboutPane />}
        </div>
      </div>
    </div>
  )
}
