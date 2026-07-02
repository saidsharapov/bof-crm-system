'use client'
import { useState, useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Lock,
  Eye,
  EyeSlash,
  ArrowRight,
  WarningCircle,
  ShieldCheck,
} from '@phosphor-icons/react'
import clsx from 'clsx'
import { useAuthStore } from '@/store/authStore'

// ── Validation schema ───────────────────────────────────────────────────────
const schema = z.object({
  login:    z.string().min(1, 'Введите логин').max(64),
  password: z.string().min(1, 'Введите пароль').max(128),
})
type FormData = z.infer<typeof schema>

// ── InputField — адаптивный (dark / light) ───────────────────────────────────
interface InputFieldProps {
  id: string
  label: string
  error?: string
  icon: React.ReactNode
  trailing?: React.ReactNode
  variant: 'dark' | 'light'
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
}

function InputField({ id, label, error, icon, trailing, variant, inputProps }: InputFieldProps) {
  const isLight = variant === 'light'

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        style={isLight ? { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.03em', textTransform: 'uppercase' as const } : undefined}
        className={clsx(!isLight && 'text-xs font-medium text-white/50 tracking-wide uppercase')}
      >
        {label}
      </label>

      <div
        className={clsx(
          'relative flex items-center rounded-[10px] transition-all duration-200',
          !isLight && 'input-ring',
          !isLight && (error ? 'border border-red-500/50 bg-red-500/5' : 'border border-white/[0.08] bg-ink-800/80'),
        )}
        style={isLight ? {
          background: error ? 'var(--danger-bg)' : 'var(--surface-sunken)',
          border: `1px solid ${error ? 'var(--danger-border)' : 'var(--border-default)'}`,
          borderRadius: 10,
          transition: 'border-color 0.15s, box-shadow 0.15s',
        } : undefined}
        onFocusCapture={isLight ? (e) => {
          if (e.currentTarget) {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--ring-accent)'
          }
        } : undefined}
        onBlurCapture={isLight ? (e) => {
          if (e.currentTarget) {
            (e.currentTarget as HTMLElement).style.borderColor = error ? 'var(--danger-border)' : 'var(--border-default)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
          }
        } : undefined}
      >
        {/* Leading icon */}
        <span
          className={clsx('absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none', !isLight && 'text-white/30')}
          style={isLight ? { color: 'var(--text-tertiary)' } : undefined}
        >
          {icon}
        </span>

        <input
          id={id}
          {...inputProps}
          className={clsx(
            'w-full py-3.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-0 font-[Geist,sans-serif] bg-transparent',
            !isLight && 'text-white/90 placeholder:text-white/20',
          )}
          style={isLight ? { color: 'var(--text-primary)' } : undefined}
          placeholder={isLight ? inputProps.placeholder : inputProps.placeholder}
        />

        {trailing && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{trailing}</span>
        )}
      </div>

      {error && (
        <p
          className={clsx('flex items-center gap-1.5 text-xs animate-fade-in', !isLight && 'text-red-400')}
          style={isLight ? { color: 'var(--danger-fg)' } : undefined}
        >
          <WarningCircle size={13} weight="fill" />
          {error}
        </p>
      )}
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function FieldSkeleton({ variant }: { variant: 'dark' | 'light' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={clsx('h-3 w-16 rounded animate-pulse', variant === 'light' ? 'bg-[var(--border-default)]' : 'bg-white/[0.06]')} />
      <div className={clsx('h-12 w-full rounded-[10px] animate-pulse', variant === 'light' ? 'bg-[var(--surface-sunken)]' : 'bg-white/[0.04]')} />
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────
interface LoginFormProps {
  variant?: 'dark' | 'light'
}

export default function LoginForm({ variant = 'dark' }: LoginFormProps) {
  const loginId    = useId()
  const passwordId = useId()
  const navigate   = useNavigate()
  const authLogin  = useAuthStore((s) => s.login)
  const isLight    = variant === 'light'

  const [showPass, setShowPass] = useState(false)
  const [shaking,  setShaking]  = useState(false)


  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: ({ login, password }: { login: string; password: string }) =>
      authLogin(login, password),
    onSuccess: () => {
      navigate('/dashboard', { replace: true })
    },
    onError: (err: Error & { response?: { status?: number } }) => {
      const status = err?.response?.status
      const msg =
        status === 401
          ? 'Неверный логин или пароль'
          : status === 429
            ? 'Слишком много попыток. Попробуйте позже'
            : 'Ошибка сервера. Попробуйте ещё раз'
      setError('root', { message: msg })
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  const isLoading = isSubmitting || mutation.isPending

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={clsx('flex flex-col gap-5', shaking && 'animate-shake')}
    >
      {isLoading && !mutation.isPending ? (
        <>
          <FieldSkeleton variant={variant} />
          <FieldSkeleton variant={variant} />
        </>
      ) : (
        <>
          <InputField
            id={loginId}
            label="Логин"
            error={errors.login?.message}
            variant={variant}
            icon={<User size={16} weight="duotone" />}
            inputProps={{
              ...register('login'),
              type: 'text',
              placeholder: 'Введите ваш логин',
              autoComplete: 'username',
              autoCapitalize: 'none',
              spellCheck: false,
              disabled: isLoading,
            }}
          />

          <InputField
            id={passwordId}
            label="Пароль"
            error={errors.password?.message}
            variant={variant}
            icon={<Lock size={16} weight="duotone" />}
            trailing={
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={isLight ? { color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', padding: 2 } : undefined}
                className={clsx(!isLight && 'text-white/30 hover:text-white/60 transition-colors focus:outline-none')}
                tabIndex={-1}
                aria-label={showPass ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPass ? <EyeSlash size={16} weight="duotone" /> : <Eye size={16} weight="duotone" />}
              </button>
            }
            inputProps={{
              ...register('password'),
              type: showPass ? 'text' : 'password',
              placeholder: '••••••••',
              autoComplete: 'current-password',
              disabled: isLoading,
            }}
          />
        </>
      )}

      {/* Root error */}
      {errors.root?.message && (
        <div
          className={clsx('flex items-start gap-2.5 rounded-xl px-4 py-3 animate-fade-in')}
          style={isLight
            ? { background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 10 }
            : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: 12 }
          }
        >
          <WarningCircle size={16} weight="fill" style={{ color: 'var(--danger-fg)', marginTop: 2, flexShrink: 0 }} />
          <div>
            <p className="text-sm" style={{ color: isLight ? 'var(--danger-fg)' : undefined }} >{errors.root.message}</p>
            {!isLight && <p className="text-xs text-red-300">{errors.root.message}</p>}
          </div>
        </div>
      )}

      {/* Кнопка входа */}
      <button
        type="submit"
        disabled={isLoading}
        style={
          isLight && !isLoading ? {
            width: '100%', height: 44, borderRadius: 10,
            background: 'var(--action-primary-bg)', color: 'var(--action-primary-fg)',
            border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.15s', fontFamily: 'var(--font-sans)',
          } : isLight && isLoading ? {
            width: '100%', height: 44, borderRadius: 10,
            background: 'var(--surface-sunken)', border: '1px solid var(--border-default)',
            color: 'var(--text-tertiary)', cursor: 'not-allowed', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-sans)',
          } : !isLight && !isLoading ? {
            background: 'var(--accent)', color: 'var(--text-on-accent)',
            boxShadow: '0 4px 20px rgba(255,237,0,0.25)',
          } : undefined
        }
        className={clsx(
          !isLight && 'group relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none',
          !isLight && (
            isLoading
              ? 'cursor-not-allowed bg-ink-700 border border-white/[0.06] text-white/40'
              : 'cursor-pointer'
          ),
        )}
        onMouseEnter={isLight && !isLoading ? (e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--action-primary-hover)' } : undefined}
        onMouseLeave={isLight && !isLoading ? (e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--action-primary-bg)' } : undefined}
      >
        {/* Shimmer (только dark) */}
        {!isLight && !isLoading && (
          <span
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
          />
        )}

        <span className={clsx(!isLight && 'relative flex items-center justify-center gap-2')}>
          {isLoading ? (
            <>
              <SpinnerIcon />
              Вход…
            </>
          ) : (
            <>
              Войти
              <ArrowRight size={16} weight="bold" className={clsx(!isLight && 'transition-transform duration-200 group-hover:translate-x-1')} />
            </>
          )}
        </span>
      </button>

      {/* Security note (dark только) */}
      {!isLight && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/20">
          <ShieldCheck size={12} weight="duotone" style={{ color: 'rgba(255,237,0,0.45)' }} />
          Защищённое соединение · BOF CRM
        </div>
      )}
    </form>
  )
}

// ── Inline spinner ────────────────────────────────────────────────────────────
function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-spin" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
