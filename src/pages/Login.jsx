import React, { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useAuth } from '../AuthContext'

export default function Login() {
  const { checkError } = useAuth()
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError(
        mode === 'signup'
          ? 'Gagal membuat akun. Gunakan email yang valid dan kata sandi minimal 6 karakter.'
          : 'Email atau kata sandi salah.'
      )
    } finally {
      setBusy(false)
    }
  }

  const handleGoogle = () => {
    setError('')
    signInWithRedirect(auth, googleProvider)
  }

  return (
    <div className="login-shell">
      <div className="login-logo">🏛️</div>
      <div className="login-title">Si Maqom</div>

      <div className="login-card">
        <h1>Akses Pengurus</h1>
        <p>Gunakan akun Google Anda untuk memverifikasi identitas.</p>

        <button type="button" className="google-btn" onClick={handleGoogle} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9C16.64 14.2 17.64 12 17.64 9.2z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.36 0-4.36-1.6-5.07-3.74H.9v2.34A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.93 10.68A5.4 5.4 0 0 1 3.65 9c0-.58.1-1.15.28-1.68V4.98H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.02l3.03-2.34z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.42 0 9 0A9 9 0 0 0 .9 4.98l3.03 2.34C4.64 5.18 6.64 3.58 9 3.58z" />
          </svg>
          Masuk dengan Google
        </button>

        <div className="login-divider">atau</div>

        {!showEmailForm ? (
          <button type="button" className="login-toggle-link" onClick={() => setShowEmailForm(true)}>
            Masuk dengan email
          </button>
        ) : (
          <>
            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ marginBottom: 12 }}
              />
              <label htmlFor="password">Kata Sandi</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button className="btn" type="submit" disabled={busy} style={{ marginTop: 16 }}>
                {busy ? 'Mohon tunggu…' : mode === 'signup' ? 'Buat Akun' : 'Masuk'}
              </button>
            </form>
            <p style={{ marginTop: 14, fontSize: 13 }}>
              {mode === 'signup' ? (
                <>
                  Sudah punya akun?{' '}
                  <button type="button" className="login-toggle-link" onClick={() => setMode('signin')}>
                    Masuk
                  </button>
                </>
              ) : (
                <>
                  Belum punya akun?{' '}
                  <button type="button" className="login-toggle-link" onClick={() => setMode('signup')}>
                    Daftar
                  </button>
                </>
              )}
            </p>
          </>
        )}

        {(error || checkError) && <p className="error-text">{error || checkError}</p>}
      </div>
    </div>
  )
}