import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Lock, SignOut, Plus, Pencil, Trash,
  CheckCircle, WarningCircle, Eye, EyeSlash,
  ShieldStar, Crown, Package as PackageIcon,
  Sun, Moon,
} from '@phosphor-icons/react'
import { useAuthStore, type UserRole } from '@/store/authStore'
import { useUserManagementStore, type AppUser } from '@/store/userManagementStore'
import { useThemeStore } from '@/store/themeStore'
import { usersApi } from '@/api/users'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { PageHeader }  from '@/components/ui/PageHeader'

// ── Role meta ─────────────────────────────────────────────────────────────────
const ROLE_META: Record<UserRole, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  ADMIN:     { label: 'Администратор', icon: Crown,        color: 'var(--warning-fg)',  bg: 'var(--warning-bg)',  border: 'var(--warning-border)'  },
  MANAGER:   { label: 'Менеджер',      icon: PackageIcon,  color: '#5b6ef5',            bg: 'rgba(91,110,245,0.1)', border: 'rgba(91,110,245,0.25)' },
  WAREHOUSE: { label: 'Кладовщик',     icon: ShieldStar,   color: 'var(--success-fg)',  bg: 'var(--success-bg)',  border: 'var(--success-border)'  },
}

// ── Helper field ──────────────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className="m-label">{label}</label>
      {children}
      {error && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--danger-fg)', margin: 0 }}>
          <WarningCircle size={11} weight="fill" />{error}
        </p>
      )}
    </div>
  )
}

function PasswordInput({ placeholder, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
      <input
        {...props}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        className="input-field"
        style={{ paddingLeft: 36, paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setShow((p) => !p)}
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
        }}
        tabIndex={-1}
      >
        {show ? <EyeSlash size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

// ── Change password form ──────────────────────────────────────────────────────
const pwSchema = z.object({
  current:  z.string().min(1, 'Введите текущий пароль'),
  next:     z.string().min(4, 'Минимум 4 символа').max(64),
  confirm:  z.string(),
}).refine((d) => d.next === d.confirm, { path: ['confirm'], message: 'Пароли не совпадают' })

type PwForm = z.infer<typeof pwSchema>

function ChangePasswordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [ok, setOk] = useState(false)

  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  })

  async function onSubmit(data: PwForm) {
    try {
      await usersApi.changePassword(data.current, data.next)
      setOk(true)
      reset()
      setTimeout(() => { setOk(false); onClose() }, 1500)
    } catch {
      setError('current', { message: 'Неверный текущий пароль' })
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Смена пароля">
      <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {ok && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px', borderRadius: 'var(--radius-xl)',
            background: 'var(--success-bg)', border: '1px solid var(--success-border)',
          }}>
            <CheckCircle size={16} weight="fill" style={{ color: 'var(--success-fg)' }} />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--success-fg)', margin: 0 }}>Пароль успешно изменён</p>
          </div>
        )}
        <Field label="Текущий пароль" error={errors.current?.message}>
          <PasswordInput {...register('current')} placeholder="••••••••" />
        </Field>
        <Field label="Новый пароль" error={errors.next?.message}>
          <PasswordInput {...register('next')} placeholder="Новый пароль" />
        </Field>
        <Field label="Повторите пароль" error={errors.confirm?.message}>
          <PasswordInput {...register('confirm')} placeholder="Повтор" />
        </Field>
        <button type="submit" style={{
          width: '100%', padding: '14px 0', borderRadius: 'var(--radius-xl)',
          border: 'none', background: '#5b6ef5', color: '#fff',
          fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
        }}>
          Сменить пароль
        </button>
      </form>
    </BottomSheet>
  )
}

// ── User form ─────────────────────────────────────────────────────────────────
const userSchema = z.object({
  name:     z.string().min(1, 'Введите имя'),
  login:    z.string().min(3, 'Мин. 3 символа').max(32).regex(/^\S+$/, 'Без пробелов'),
  role:     z.enum(['ADMIN', 'MANAGER', 'WAREHOUSE']),
  password: z.string().min(4, 'Мин. 4 символа'),
  active:   z.boolean(),
})
type UserForm = z.infer<typeof userSchema>

function UserSheet({
  open, onClose, initial,
}: { open: boolean; onClose: () => void; initial?: AppUser }) {
  const { addUser, updateUser, removeUser } = useUserManagementStore()
  const [confirmDel, setConfirmDel]         = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(initial ? userSchema.partial({ password: true }) : userSchema),
    defaultValues: {
      name:     initial?.name     ?? '',
      login:    initial?.login    ?? '',
      role:     initial?.role     ?? 'MANAGER',
      password: '',
      active:   initial?.active   ?? true,
    },
  })

  const watchRole = watch('role')

  async function onSubmit(data: UserForm) {
    if (initial) {
      await updateUser(initial.id, {
        name:   data.name,
        login:  data.login,
        role:   data.role,
        active: data.active,
        ...(data.password ? { password: data.password } : {}),
      })
    } else {
      await addUser({ ...data, active: true })
    }
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? 'Редактировать пользователя' : 'Новый пользователь'} tall>
      <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Полное имя" error={errors.name?.message}>
          <input {...register('name')} placeholder="Иван Иванов" className="input-field" />
        </Field>
        <Field label="Логин" error={errors.login?.message}>
          <input {...register('login')} placeholder="ivan.ivanov" autoCapitalize="none" className="input-field" />
        </Field>
        <Field label={initial ? 'Новый пароль (оставьте пустым)' : 'Пароль'} error={errors.password?.message}>
          <PasswordInput {...register('password')} placeholder={initial ? 'не менять' : 'Пароль'} />
        </Field>

        <Field label="Роль" error={errors.role?.message}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {(['ADMIN', 'MANAGER', 'WAREHOUSE'] as UserRole[]).map((r) => {
              const meta = ROLE_META[r]
              const isSelected = watchRole === r
              return (
                <label key={r} style={{ cursor: 'pointer' }}>
                  <input type="radio" {...register('role')} value={r} style={{ display: 'none' }} />
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: 10, borderRadius: 'var(--radius-xl)', textAlign: 'center',
                    border: `1px solid ${isSelected ? meta.border : 'var(--border-subtle)'}`,
                    background: isSelected ? meta.bg : 'var(--surface-sunken)',
                    color: isSelected ? meta.color : 'var(--text-tertiary)',
                    transition: 'all var(--dur-fast)',
                  }}>
                    <meta.icon size={18} weight="duotone" />
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
              <input type="checkbox" {...register('active')} style={{ display: 'none' }} />
              <div className="w-10 h-6 bg-white/10 peer-checked:bg-brand-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-4" />
            </label>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
          <button type="button" onClick={onClose} style={{
            flex: 1, padding: '12px 0', borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)', background: 'none',
            fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', cursor: 'pointer',
          }}>Отмена</button>
          <button type="submit" style={{
            flex: 1, padding: '12px 0', borderRadius: 'var(--radius-xl)',
            border: 'none', background: '#5b6ef5', color: '#fff',
            fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
          }}>
            {initial ? 'Сохранить' : 'Создать'}
          </button>
        </div>

        {initial && (
          !confirmDel ? (
            <button type="button" onClick={() => setConfirmDel(true)} style={{
              width: '100%', padding: '10px 0', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--danger-fg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              borderRadius: 'var(--radius-xl)',
            }}>
              <Trash size={14} /> Удалить пользователя
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setConfirmDel(false)} style={{
                flex: 1, padding: '10px 0', borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)', background: 'none',
                fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', cursor: 'pointer',
              }}>Нет</button>
              <button type="button" onClick={async () => { await removeUser(initial.id); onClose() }} style={{
                flex: 1, padding: '10px 0', borderRadius: 'var(--radius-xl)',
                border: 'none', background: 'var(--danger-solid)', color: '#fff',
                fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
              }}>Да, удалить</button>
            </div>
          )
        )}
      </form>
    </BottomSheet>
  )
}

// ── User card ─────────────────────────────────────────────────────────────────
function UserCard({ appUser, onEdit }: { appUser: AppUser; onEdit: () => void }) {
  const { user: me } = useAuthStore()
  const meta         = ROLE_META[appUser.role]
  const initials     = appUser.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const isMe         = me?.login === appUser.login

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
      transition: 'background var(--dur-fast)',
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700,
        background: appUser.active
          ? 'linear-gradient(135deg, #3d55d0 0%, #5b6ef5 100%)'
          : 'var(--surface-sunken)',
        color: appUser.active ? '#fff' : 'var(--text-tertiary)',
      }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
            {appUser.name}
          </p>
          {isMe && (
            <span style={{
              fontSize: 9, color: '#5b6ef5', background: 'rgba(91,110,245,0.1)',
              padding: '2px 6px', borderRadius: 4, fontWeight: 600, border: '1px solid rgba(91,110,245,0.25)', flexShrink: 0,
            }}>Это вы</span>
          )}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', margin: '2px 0 0' }}>
          @{appUser.login}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <span style={{
          fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
          padding: '2px 6px', borderRadius: 6,
          color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
        }}>
          {meta.label}
        </span>
        {!appUser.active && (
          <span style={{ fontSize: 9, color: 'var(--text-disabled)' }}>неактивен</span>
        )}
      </div>

      <button onClick={onEdit} style={{
        padding: 8, background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-tertiary)', transition: 'color var(--dur-fast)',
      }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
      >
        <Pencil size={14} weight="duotone" />
      </button>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p className="m-label" style={{ paddingLeft: 4 }}>{title}</p>
      <div className="m-list">{children}</div>
    </section>
  )
}

function SettingRow({
  icon: Icon, label, sub, onClick, danger = false, iconColor,
}: {
  icon: React.ElementType; label: string; sub?: string
  onClick?: () => void; danger?: boolean; iconColor?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px', textAlign: 'left', background: 'none', border: 'none',
        cursor: 'pointer', transition: 'background var(--dur-fast)',
        borderRadius: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = danger ? 'var(--danger-bg)' : 'var(--surface-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <Icon size={18} weight="duotone" style={{ color: iconColor ?? (danger ? 'var(--danger-fg)' : 'var(--text-tertiary)'), flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 'var(--text-sm)', color: danger ? 'var(--danger-fg)' : 'var(--text-primary)', margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, marginBottom: 0 }}>{sub}</p>}
      </div>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SettingsPage() {
  const { user, logout }    = useAuthStore()
  const { users, fetch: fetchUsers } = useUserManagementStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const navigate            = useNavigate()
  const [pwOpen,   setPwOpen]   = useState(false)
  const [userSheet, setUserSheet] = useState<{ open: boolean; user?: AppUser }>({ open: false })

  const isAdmin = user?.role === 'ADMIN'
  useEffect(() => {
    if (isAdmin) fetchUsers()
  }, [isAdmin])

  if (!user) return null

  const meta    = ROLE_META[user.role]
  const initials = user.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div style={{ minHeight: '100dvh' }}>
      <PageHeader title="Настройки" />

      <main style={{ padding: '20px 16px', paddingBottom: 104, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Profile card */}
        <div className="m-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-2xl)', flexShrink: 0,
            background: 'linear-gradient(135deg, #3d55d0 0%, #5b6ef5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: '#fff',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </p>
            <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
              @{user.login}
            </p>
            <span style={{
              display: 'inline-block', marginTop: 6, fontSize: 9, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '2px 8px', borderRadius: 6,
              color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
            }}>
              {meta.label}
            </span>
          </div>
        </div>

        {/* Appearance */}
        <Section title="Внешний вид">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
            {theme === 'dark'
              ? <Moon size={18} weight="duotone" style={{ color: '#5b6ef5' }} />
              : <Sun  size={18} weight="duotone" style={{ color: 'var(--warning-fg)' }} />
            }
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', margin: 0 }}>Тема оформления</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, marginBottom: 0 }}>
                {theme === 'dark' ? 'Тёмная' : 'Светлая'}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              aria-label="Переключить тему"
              style={{
                position: 'relative', width: 48, height: 24, borderRadius: 12,
                border: 'none', cursor: 'pointer',
                background: theme === 'dark' ? '#5b6ef5' : 'var(--warning-fg)',
                transition: 'background 0.3s',
              }}
            >
              <span style={{
                position: 'absolute', top: 2,
                left: theme === 'dark' ? 26 : 2,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left 0.3s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
        </Section>

        {/* Account */}
        <Section title="Аккаунт">
          <SettingRow
            icon={Lock} label="Сменить пароль" sub="Изменить пароль для входа"
            onClick={() => setPwOpen(true)} iconColor="#5b6ef5"
          />
        </Section>

        {/* Users — admin only */}
        {isAdmin && (
          <Section title="Пользователи">
            <ul className="divide-ds">
              {users.map((u) => (
                <UserCard
                  key={u.id}
                  appUser={u}
                  onEdit={() => setUserSheet({ open: true, user: u })}
                />
              ))}
            </ul>
            <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <SettingRow
                icon={Plus} label="Добавить пользователя"
                onClick={() => setUserSheet({ open: true, user: undefined })}
                iconColor="var(--success-fg)"
              />
            </div>
          </Section>
        )}

        {/* App info */}
        <Section title="О приложении">
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Версия', 'v0.1.0'],
              ['Режим', 'PWA'],
              ['Backend', 'NestJS REST API'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{k}</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Logout */}
        <Section title="Сессия">
          <SettingRow
            icon={SignOut} label="Выйти из аккаунта"
            onClick={() => { logout(); navigate('/login', { replace: true }) }}
            danger
          />
        </Section>

      </main>

      <ChangePasswordSheet open={pwOpen} onClose={() => setPwOpen(false)} />
      <UserSheet
        open={userSheet.open}
        onClose={() => setUserSheet({ open: false })}
        initial={userSheet.user}
      />
    </div>
  )
}
