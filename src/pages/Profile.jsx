import React, { useState } from 'react'
import { updateProfile } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../AuthContext'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState(user?.displayName || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaved(false)
    setError('')

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Nama tidak boleh kosong.')
      return
    }

    setSaving(true)
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed })
      await refreshUser()
      setName(trimmed)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="section-row">
        <h2>Profil</h2>
      </div>

      <div className="card">
        <div className="list-card-title">{user?.displayName || user?.email}</div>
        <div className="list-card-sub">{user?.email}</div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Nama Tampilan</label>
          <input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setSaved(false)
              setError('')
            }}
            placeholder="cth. Yusuf"
            style={{ marginBottom: 12 }}
          />
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan Nama'}
          </button>
          {error && <p className="error-text">{error}</p>}
          {saved && <p style={{ color: 'var(--green)', fontSize: 13, marginTop: 10 }}>Nama berhasil disimpan.</p>}
        </form>
      </div>
    </>
  )
}
