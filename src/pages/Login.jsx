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
          ? 'Could not create account. Use a real email and a password with 6+ characters.'
          : 'Wrong email or password.'
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
      <div className="login-card">
        <h1>Ledger</h1>
        <p>
          {mode === 'signup'
            ? 'Create an account to get started.'
            : 'Sign in to manage cash, agenda and org data.'}
        </p>

        <button
          type="button"
          className="btn-outline"
          onClick={handleGoogle}
          disabled={busy}
          style={{ width: '100%', marginBottom: 16 }}
        >
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, margin: '4px 0 16px' }}>
          or
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ marginBottom: 12 }}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button className="btn" type="submit" disabled={busy} style={{ marginTop: 18, width: '100%' }}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
          {(error || checkError) && <p className="error-text">{error || checkError}</p>}
        </form>

        <p style={{ marginTop: 18, fontSize: 13, textAlign: 'center' }}>
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                style={{ background: 'none', border: 'none', color: 'var(--brass)', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Need an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{ background: 'none', border: 'none', color: 'var(--brass)', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
              >
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
