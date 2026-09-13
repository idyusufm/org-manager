import React from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

  if (!open) return null

  const goToProfile = () => {
    onClose()
    navigate('/profile')
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel">
        <button className="drawer-header" onClick={goToProfile} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <div className="avatar-circle">
            <PersonIcon />
          </div>
          <div>
            {user?.displayName && (
              <div style={{ fontWeight: 700, fontSize: 15 }}>{user.displayName}</div>
            )}
            <div className="drawer-email">{user?.email}</div>
          </div>
        </button>

        <div className="drawer-footer" style={{ marginTop: 'auto' }}>
          <button className="btn" style={{ background: 'var(--red)' }} onClick={logout}>
            Keluar
          </button>
        </div>
      </div>
    </>
  )
}