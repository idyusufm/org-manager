import React from 'react'
import { useAuth } from '../AuthContext'

export default function SideMenu({ open, onClose }) {
  const { logout } = useAuth()

  if (!open) return null

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel">
        <div style={{ padding: 18 }}>
          <button className="btn" style={{ background: 'var(--red)' }} onClick={logout}>
            Keluar
          </button>
        </div>
      </div>
    </>
  )
}