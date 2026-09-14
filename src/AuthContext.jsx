import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, getRedirectResult, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkError, setCheckError] = useState('')

  useEffect(() => {
    // Surfaces any error from the Google redirect sign-in itself
    // (e.g. unauthorized domain, blocked storage) instead of failing silently.
    getRedirectResult(auth).catch((err) => {
      setCheckError(`Google sign-in gagal (${err.code || 'unknown'}). Coba lagi atau gunakan email/kata sandi.`)
    })
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null)
        setLoading(false)
        return
      }
      setCheckError('')
      try {
        const email = (u.email || '').toLowerCase()
        const snap = await getDoc(doc(db, 'allowedEmails', email))
        if (snap.exists()) {
          setUser({ ...u })
        } else {
          setCheckError("This account isn't approved yet. Ask an admin to add your email, then sign in again.")
          await signOut(auth)
          setUser(null)
        }
      } catch (e) {
        setCheckError('Could not verify access. Please try again.')
        await signOut(auth)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  const logout = () => signOut(auth)

  const refreshUser = async () => {
    if (!auth.currentUser) return
    await auth.currentUser.reload()
    setUser({ ...auth.currentUser })
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, checkError, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
