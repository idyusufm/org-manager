import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Verify from './pages/Verify'
import Cash from './pages/Cash'
import Agenda from './pages/Agenda'
import Org from './pages/Org'
import Profile from './pages/Profile'
import Approvals from './pages/Approvals'
import Logs from './pages/Logs'

function Gate({ children }) {
  const { loading, firebaseUser, approved } = useAuth()
  if (loading) return <div style={{ padding: 40 }}>Memuat…</div>
  if (!firebaseUser) return <Navigate to="/login" replace />
  if (!approved) return <Navigate to="/verify" replace />
  return <Layout>{children}</Layout>
}

function AdminGate({ children }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/cash" replace />
  return children
}

function AppRoutes() {
  const { loading, firebaseUser, approved } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={!loading && firebaseUser ? <Navigate to={approved ? '/cash' : '/verify'} replace /> : <Login />}
      />
      <Route
        path="/verify"
        element={!loading && firebaseUser && !approved ? <Verify /> : <Navigate to={firebaseUser ? '/cash' : '/login'} replace />}
      />
      <Route path="/cash" element={<Gate><Cash /></Gate>} />
      <Route path="/agenda" element={<Gate><Agenda /></Gate>} />
      <Route path="/org" element={<Gate><Org /></Gate>} />
      <Route path="/profile" element={<Gate><Profile /></Gate>} />
      <Route path="/approvals" element={<Gate><AdminGate><Approvals /></AdminGate></Gate>} />
      <Route path="/logs" element={<Gate><AdminGate><Logs /></AdminGate></Gate>} />
      <Route path="*" element={<Navigate to="/cash" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
