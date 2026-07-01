import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { BottomNav }   from '@/components/layout/BottomNav'

/**
 * Shared wrapper for all authenticated mobile routes.
 * – Handles auth guard (redirects to /login if no token)
 * – Renders persistent BottomNav above page content
 * – Sets page background / color via DS tokens (CSS variables)
 */
export function MobileLayout() {
  const { token, user } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <Outlet />
      <BottomNav role={user.role} />
    </div>
  )
}
