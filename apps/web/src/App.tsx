import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useThemeStore }  from './store/themeStore'
import { useIsDesktop }   from './hooks/useIsDesktop'
import { PwaUpdateToast } from './components/pwa/PwaUpdateToast'

// Layouts
import { DesktopLayout } from './layouts/DesktopLayout'
import { MobileLayout }  from './layouts/MobileLayout'

// Shared pages (no layout split)
import { LoginPage }      from './pages/LoginPage'
import { MovementPage }   from './pages/MovementPage'

// Mobile pages
import { DashboardPage }  from './pages/DashboardPage'
import { ProductsPage }   from './pages/ProductsPage'
import { WarehousePage }  from './pages/WarehousePage'
import { ProductionPage } from './pages/ProductionPage'
import { OrdersPage }     from './pages/OrdersPage'
import { SettingsPage }   from './pages/SettingsPage'

// Desktop pages
import { DashboardDesktop }  from './pages/desktop/DashboardDesktop'
import { ProductsDesktop }   from './pages/desktop/ProductsDesktop'
import { WarehouseDesktop }  from './pages/desktop/WarehouseDesktop'
import { OrdersDesktop }     from './pages/desktop/OrdersDesktop'
import { ProductionDesktop } from './pages/desktop/ProductionDesktop'
import { SettingsDesktop }   from './pages/desktop/SettingsDesktop'

// ── Theme provider ────────────────────────────────────────────────────────────
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore()
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.removeAttribute('data-theme')
    }
  }, [theme])
  return <>{children}</>
}

// ── Routes ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  const isDesktop = useIsDesktop()

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {isDesktop ? (
        /* ── Desktop ── */
        <Route element={<DesktopLayout />}>
          <Route path="/dashboard"         element={<DashboardDesktop />}  />
          <Route path="/products"          element={<ProductsDesktop />}   />
          <Route path="/warehouse"         element={<WarehouseDesktop />}  />
          <Route path="/warehouse/receipt" element={<MovementPage />}      />
          <Route path="/warehouse/expense" element={<MovementPage />}      />
          <Route path="/production"        element={<ProductionDesktop />} />
          <Route path="/orders"            element={<OrdersDesktop />}     />
          <Route path="/settings"          element={<SettingsDesktop />}   />
        </Route>
      ) : (
        /* ── Mobile ── auth guard is inside MobileLayout */
        <Route element={<MobileLayout />}>
          <Route path="/dashboard"         element={<DashboardPage />}  />
          <Route path="/products"          element={<ProductsPage />}   />
          <Route path="/warehouse"         element={<WarehousePage />}  />
          <Route path="/warehouse/receipt" element={<MovementPage />}   />
          <Route path="/warehouse/expense" element={<MovementPage />}   />
          <Route path="/production"        element={<ProductionPage />} />
          <Route path="/orders"            element={<OrdersPage />}     />
          <Route path="/settings"          element={<SettingsPage />}   />
        </Route>
      )}

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
        <PwaUpdateToast />
      </BrowserRouter>
    </ThemeProvider>
  )
}
