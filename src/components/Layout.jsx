import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import SideMenu from './SideMenu'

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="currentColor" />
    </svg>
  )
}

export default function Layout({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : '')

  return (
    <div className="app-shell">
      <header className="top-bar">
        <button className="hamburger-btn" onClick={() => setMenuOpen(true)} aria-label="Buka menu">
          ☰
        </button>
        <div className="top-bar-brand" style={{ flex: 1 }}>Si Maqom - {displayName}</div>
        <button
          className="hamburger-btn avatar-btn"
          onClick={() => navigate('/profile')}
          aria-label="Profil"
        >
          <PersonIcon />
        </button>
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