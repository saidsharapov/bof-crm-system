import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import BofLogo from '@/components/login/BofLogo'
import LoginForm from '@/components/login/LoginForm'

// ── Desktop: левая тёмная панель с анимациями ────────────────────────────────
function DesktopHeroPanel() {
  return (
    <div
      style={{
        width: '52%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 48,
        background: 'radial-gradient(120% 90% at 50% 18%, #16161A 0%, #0C0C0E 62%)',
        flexShrink: 0,
      }}
    >
      <style>{`
        @keyframes bofRise {
          from { opacity: 0; transform: translateY(18px) scale(0.96); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes bofFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
        @keyframes bofGlow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 0.9;  transform: scale(1.08); }
        }
        @keyframes bofSweep {
          0%   { transform: translateX(-130%) skewX(-18deg); opacity: 0; }
          18%  { opacity: 0.9; }
          50%  { opacity: 0; }
          100% { transform: translateX(230%) skewX(-18deg); opacity: 0; }
        }
        @keyframes bofRing {
          0%   { transform: scale(0.85); opacity: 0; }
          40%  { opacity: 0.5; }
          100% { transform: scale(1.7);  opacity: 0; }
        }
        .bof-brand-anim { animation: bofRise 1s cubic-bezier(.16,.84,.34,1) both; }
        .bof-logo-float { animation: bofFloat 7s ease-in-out infinite; }
        .bof-glow-pulse { animation: bofGlow 6s ease-in-out infinite; }
        .bof-sweep-line { animation: bofSweep 7s ease-in-out infinite; }
        .bof-sweep-line.l2 { animation-delay: 2.4s; }
        .bof-sweep-line.l3 { animation-delay: 4.8s; }
        .bof-ring-exp { animation: bofRing 6s ease-out infinite; }
        .bof-ring-exp.r2 { animation-delay: 3s; }
        @media (prefers-reduced-motion: reduce) {
          .bof-brand-anim, .bof-logo-float, .bof-glow-pulse,
          .bof-sweep-line, .bof-ring-exp { animation: none !important; }
        }
      `}</style>

      {/* Фоновые слои */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 55% at 50% 42%, rgba(255,237,0,0.10), transparent 70%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5, background: 'repeating-linear-gradient(115deg, transparent 0 38px, rgba(255,255,255,0.012) 38px 39px)' }} />
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 200px 40px rgba(0,0,0,0.55)' }} />

      {/* Световые линии */}
      <div className="bof-sweep-line"    style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '200%', background: 'linear-gradient(90deg, transparent, rgba(255,237,0,0.10), transparent)', pointerEvents: 'none' }} />
      <div className="bof-sweep-line l2" style={{ position: 'absolute', top: 0, left: 0, width: '26%', height: '200%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', pointerEvents: 'none' }} />
      <div className="bof-sweep-line l3" style={{ position: 'absolute', top: 0, left: 0, width: '34%', height: '200%', background: 'linear-gradient(90deg, transparent, rgba(255,237,0,0.07), transparent)', pointerEvents: 'none' }} />

      {/* Верх — wordmark */}
      <div className="bof-brand-anim" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: '#FFED00', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px -4px rgba(255,222,0,0.55)' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 12, color: '#1A1800', letterSpacing: '-0.04em' }}>BOF</span>
        </span>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>BOF CRM</span>
      </div>

      {/* Центр — логотип + заголовок */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 36, zIndex: 2 }}>
        <div className="bof-logo-float" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Жёлтое свечение */}
          <div className="bof-glow-pulse" style={{ position: 'absolute', width: '128%', height: '128%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,237,0,0.55) 0%, rgba(255,237,0,0.16) 42%, transparent 70%)', filter: 'blur(28px)' }} />
          {/* Расходящиеся кольца */}
          <div className="bof-ring-exp"    style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '1px solid rgba(255,237,0,0.30)' }} />
          <div className="bof-ring-exp r2" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '1px solid rgba(255,237,0,0.22)' }} />
          {/* Логотип */}
          <img
            className="bof-brand-anim"
            src="/bof-logo.png"
            alt="BOF Textile Printing"
            style={{ position: 'relative', width: 'min(24vw, 280px)', height: 'auto', borderRadius: '50%', boxShadow: '0 30px 80px -20px rgba(255,222,0,0.45), 0 8px 28px rgba(0,0,0,0.5)' }}
          />
        </div>
        <div className="bof-brand-anim" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.05 }}>BOF CRM</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>Система управления производством</div>
        </div>
      </div>

      {/* Низ — копирайт */}
      <div className="bof-brand-anim" style={{ position: 'relative', fontSize: 12, color: 'rgba(255,255,255,0.4)', zIndex: 2 }}>
        © 2026 BOF Textile Printing · Enterprise
      </div>
    </div>
  )
}

// ── Desktop: правая белая панель с формой ────────────────────────────────────
function DesktopFormPanel() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: 'var(--surface-card)' }}>
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Заголовок */}
        <div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)', lineHeight: 1.15 }}>
            Добро пожаловать
          </div>
          <div style={{ fontSize: 'var(--text-md)', color: 'var(--text-tertiary)', marginTop: 6 }}>
            Войдите в систему управления
          </div>
        </div>

        {/* Форма (светлая тема) */}
        <LoginForm variant="light" />

        {/* Нижняя подпись */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Защищённое соединение · BOF CRM v2.0
        </div>
      </div>
    </div>
  )
}

// ── Мобильный вид — идентичен десктопной форме ───────────────────────────────
function MobileLogin() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: 'var(--surface-page)' }}>
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Логотип */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <BofLogo size={52} />
          <div>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)', lineHeight: 1.15 }}>
              Добро пожаловать
            </div>
            <div style={{ fontSize: 'var(--text-md)', color: 'var(--text-tertiary)', marginTop: 6 }}>
              Войдите в систему управления
            </div>
          </div>
        </div>

        {/* Форма */}
        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-2xl)', padding: 24, boxShadow: 'var(--shadow-md)' }}>
          <LoginForm variant="light" />
        </div>

        {/* Нижняя подпись */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Защищённое соединение · BOF CRM v2.0
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { token } = useAuthStore()
  const navigate  = useNavigate()
  const isDesktop = useIsDesktop()

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <DesktopHeroPanel />
        <DesktopFormPanel />
      </div>
    )
  }

  return <MobileLogin />
}
