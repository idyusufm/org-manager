import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar-brand">Ledger</div>
        <div className="top-bar-user">
          <span>{user?.email}</span>
          <button onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="main">{children}</main>

      <nav className="bottom-nav">
        <NavLink to="/cash" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="icon">💰</span>
          Cash
        </NavLink>
        <NavLink to="/agenda" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="icon">🗓️</span>
          Agenda
        </NavLink>
        <NavLink to="/org" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="icon">👥</span>
          Org
        </NavLink>
      </nav>
    </div>
  )
}
