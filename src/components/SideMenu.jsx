import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../AuthContext'

function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="currentColor" />
    </svg>
  )
}

export default function SideMenu({ open, onClose }) {
  const { user, logout } = useAuth()

  if (!open) return null

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-header">
          <div className="avatar-circle">
            <PersonIcon />
          </div>
          <div className="drawer-email">{user?.email}</div>
        </div>

        <nav className="drawer-nav">
          <NavLink to="/profile" onClick={onClose} className={({ isActive }) => (isActive ? 'active' : '')}>
            Profil
          </NavLink>
          <NavLink to="/cash" onClick={onClose} className={({ isActive }) => (isActive ? 'active' : '')}>
            Kelola Kas
          </NavLink>
          <NavLink to="/agenda" onClick={onClose} className={({ isActive }) => (isActive ? 'active' : '')}>
            Kelola Agenda
          </NavLink>
          <NavLink to="/org" onClick={onClose} className={({ isActive }) => (isActive ? 'active' : '')}>
            Kelola Pengurus
          </NavLink>
        </nav>

        <div className="drawer-footer">
          <button className="btn" style={{ background: 'var(--red)' }} onClick={logout}>
            Keluar
          </button>
        </div>
      </div>
    </>
  )
}