import React from 'react'
import { useAuth } from '../AuthContext'

export default function Profile() {
  const { user } = useAuth()

  return (
    <>
      <div className="section-row">
        <h2>Profil</h2>
      </div>
      <div className="card">
        <div className="list-card-title">{user?.email}</div>
        <div className="list-card-sub">Akun terverifikasi dan disetujui pengurus.</div>
      </div>
    </>
  )
}