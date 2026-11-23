import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import AOS from 'aos'
import { ToastContainer, Zoom } from 'react-toastify'
import { NzToastContainer } from './components/ui/NzToast'
import LoadingSpinner from './components/LoadingSpinner'
import PageSkeleton from './components/PageSkeleton'
import ScrollToTop from './components/ScrollToTop'

// Lazy Load Active Pages
const HomePage = lazy(() => import('./pages/HomePage'))
const StoryPage = lazy(() => import('./pages/StoryPage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))

import { ThemeProvider } from './context/ThemeContext'
import { FlyToCartProvider } from './context/FlyToCartContext'
import { MaintenanceProvider, useMaintenance } from './context/MaintenanceContext'
import MaintenanceScreen from './components/MaintenanceScreen'
import MaintenanceAdminBadge from './components/MaintenanceAdminBadge'
import { getValidAdminToken } from './lib/authSession'

function MaintenanceGuard({ children }) {
  const { isMaintenance, maintenanceMessage, maintenanceEstimatedEnd, loading } = useMaintenance()
  const isAdmin = Boolean(getValidAdminToken())

  if (loading) {
    return <PageSkeleton />
  }

  // Jika sedang maintenance, hanya block jika BUKAN admin.
  // Jika admin login, admin diizinkan masuk untuk testing / live preview.
  if (isMaintenance && !isAdmin) {
    return <MaintenanceScreen message={maintenanceMessage} estimatedEnd={maintenanceEstimatedEnd} />
  }

  return children
}

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
      easing: 'ease-out-cubic',
      offset: 100,
    })
  }, [])

  return (
    <ThemeProvider>
      <MaintenanceProvider>
        <FlyToCartProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          {/* Auto Scroll To Top on route change */}
          <ScrollToTop />
          {/* Floating badge for logged in admin when website is in Maintenance Mode */}
          <MaintenanceAdminBadge />
          {/* NzToast — custom shop/global notifications (dual-theme, centered) */}
          <NzToastContainer />
          {/* Legacy ToastContainer — kept for admin pages */}
          <ToastContainer
            position="bottom-center"
            autoClose={1500}
            hideProgressBar={true}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            transition={Zoom}
            toastStyle={{ backgroundColor: 'transparent', boxShadow: 'none', padding: 0 }}
          />
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Public Core Routes protected by MaintenanceGuard */}
              <Route path="/" element={<MaintenanceGuard><HomePage /></MaintenanceGuard>} />
              <Route path="/story" element={<MaintenanceGuard><StoryPage /></MaintenanceGuard>} />
              <Route path="/about" element={<Navigate to="/story" replace />} />
              <Route path="/shop" element={<MaintenanceGuard><ShopPage /></MaintenanceGuard>} />

              {/* Redirects for legacy standalone routes to active pages */}
              <Route path="/members" element={<Navigate to="/story" replace />} />
              <Route path="/music" element={<Navigate to="/story" replace />} />
              <Route path="/schedule" element={<Navigate to="/" replace />} />
              <Route path="/media" element={<Navigate to="/story" replace />} />
              <Route path="/faq" element={<Navigate to="/" replace />} />

              {/* Admin Portal Routes (Always Accessible) */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminPage />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
        </FlyToCartProvider>
      </MaintenanceProvider>
    </ThemeProvider>
  )
}

export default App
