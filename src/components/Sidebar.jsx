import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        Ledger
        <span>Cash · Agenda · Org</span>
      </div>
      <div className="sidebar-nav">
        <NavLink to="/cash" className={({ isActive }) => (isActive ? 'active' : '')}>
          Cash
        </NavLink>
        <NavLink to="/agenda" className={({ isActive }) => (isActive ? 'active' : '')}>
          Agenda
        </NavLink>
        <NavLink to="/org" className={({ isActive }) => (isActive ? 'active' : '')}>
          Organization
        </NavLink>
      </div>
      <div className="sidebar-footer">
        <div style={{ marginBottom: 8, wordBreak: 'break-word' }}>{user?.email}</div>
        <button onClick={logout}>Sign out</button>
      </div>
    </nav>
  )
}
