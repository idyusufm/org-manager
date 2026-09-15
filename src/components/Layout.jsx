import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import SideMenu from './SideMenu'

export default function Layout({ children }) {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : '')

  return (
    <div className="app-shell">
      <header className="top-bar">
        <button className="hamburger-btn" onClick={() => setMenuOpen(true)} aria-label="Buka menu">
          ☰
        </button>
        <div className="top-bar-brand">Si Maqom - {displayName}</div>
      </header>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

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