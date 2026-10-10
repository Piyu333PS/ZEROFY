import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import { useAuth } from './context/AuthContext'
import PricingPage from './pages/PricingPage'
import { useBackButton } from './hooks/useBackButton'
import { AuthProvider } from './context/AuthContext'
import Footer from './components/Footer'
import { Toaster } from './components/ui/Toast'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsConditions from './pages/TermsConditions'

// Billing app
import InvoiceMaker from './pages/tools/InvoiceMaker'
import DashboardLayout from './components/dashboard/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import InvoicesPage from './pages/dashboard/InvoicesPage'
import CustomersPage from './pages/dashboard/CustomersPage'
import ItemsPage from './pages/dashboard/ItemsPage'
import PaymentsPage from './pages/dashboard/PaymentsPage'
import ReportsPage from './pages/dashboard/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import BillingPage from './pages/BillingPage'
import RefundPage from './pages/RefundPage'
import ContactPage from './pages/ContactPage'

function NotFound() {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 10, color: 'var(--text)' }}>Page not found</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 14 }}>
        This page does not exist. Go back to your billing app.
      </p>
      <a href="/" style={{
        background: '#EFA02F', color: '#12263F', padding: '10px 22px',
        borderRadius: 100, textDecoration: 'none', fontWeight: 700, fontSize: 14,
        display: 'inline-flex', alignItems: 'center'
      }}>Go to Zerofy</a>
    </div>
  )
}

function RootGate() {
  const { user, initializing } = useAuth()
  if (initializing) return null
  if (user) return <Navigate to="/app" replace />
  return <LoginPage />
}

function AppInner() {
  useBackButton()
  const location = useLocation()
  const isLoginScreen = location.pathname === '/'
  // Billing app aur invoice maker ka apna shell hai — site ka navbar / marketing footer wahan nahi aate
  const isAppScreen = location.pathname.startsWith('/app') || location.pathname === '/tools/invoice-maker'
  const bare = isLoginScreen || isAppScreen

  // App / login ke peeche page ka background bhi paper rahe (warna neeche dark patti dikhti thi)
  useEffect(() => {
    document.body.style.background = bare ? '#F4F5F1' : ''
    return () => { document.body.style.background = '' }
  }, [bare])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!bare && <Navbar />}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<RootGate />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/refund" element={<RefundPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />

          {/* Billing dashboard */}
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="quotations" element={<InvoicesPage key="quotation" docType="quotation" />} />
            <Route path="credit-notes" element={<InvoicesPage key="credit_note" docType="credit_note" />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="items" element={<ItemsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage embedded />} />
          </Route>

          <Route path="/tools/invoice-maker" element={<InvoiceMaker />} />

          {/* Zerofy is now only the billing app — old tool links land on the home screen */}
          <Route path="/tools/*" element={<Navigate to="/" replace />} />
          <Route path="/all-tools" element={<Navigate to="/" replace />} />
          <Route path="/govt-jobs" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!bare && <Footer />}
      <Toaster />
    </div>
  )
}

export default function App() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.setItem('zerofy-theme', 'dark')
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  )
}
