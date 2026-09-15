import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, getRedirectResult, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [approved, setApproved] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checkError, setCheckError] = useState('')

  const checkApproval = async (u) => {
    if (!u) {
      setApproved(false)
      setIsAdmin(false)
      return
    }
    const email = (u.email || '').toLowerCase()
    try {
      const snap = await getDoc(doc(db, 'allowedEmails', email))
      if (snap.exists()) {
        setApproved(true)
        setIsAdmin(snap.data()?.admin === true)
      } else {
        setApproved(false)
        setIsAdmin(false)
      }
    } catch (e) {
      setApproved(false)
      setIsAdmin(false)
    }
  }

  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      setCheckError(`Google sign-in gagal (${err.code || 'unknown'}).`)
    })
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setCheckError('')
      setFirebaseUser(u)
      await checkApproval(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const logout = () => signOut(auth)

  const refreshUser = async () => {
    if (!auth.currentUser) return
    await auth.currentUser.reload()
    setFirebaseUser({ ...auth.currentUser })
  }

  const recheckApproval = async () => {
    if (auth.currentUser) await checkApproval(auth.currentUser)
  }

  return (
    <AuthContext.Provider
      value={{
        user: approved ? firebaseUser : null,
        firebaseUser,
        approved,
        isAdmin,
        loading,
        logout,
        checkError,
        refreshUser,
        recheckApproval,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
