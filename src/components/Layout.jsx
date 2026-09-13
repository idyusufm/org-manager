import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Layout({ children }) {
  const { logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar-brand">Si Maqom - Dasbor</div>
        <div className="top-bar-user">
          <button onClick={logout}>Keluar</button>
        </div>
      </header>

      <main className="main">{children}</main>

      <nav className="bottom-nav">
        <NavLink to="/cash" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="icon">💰</span>
          Kas
        </NavLink>
        <NavLink to="/agenda" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="icon">📅</span>
          Agenda
        </NavLink>
        <NavLink to="/org" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="icon">👥</span>
          Pengurus
        </NavLink>
      </nav>
    </div>
  )
}