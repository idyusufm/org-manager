import React, { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, setDoc, deleteDoc, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export default function Approvals() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'pendingApprovals'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setPending(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const approve = async (p) => {
    await setDoc(doc(db, 'allowedEmails', p.id), {
      code: p.code,
      name: p.name || '',
      approvedAt: serverTimestamp(),
      admin: false,
    })
    await deleteDoc(doc(db, 'pendingApprovals', p.id))
  }

  const reject = async (id) => {
    if (!window.confirm('Tolak permintaan ini?')) return
    await deleteDoc(doc(db, 'pendingApprovals', id))
  }

  return (
    <>
      <div className="section-row">
        <h2>Persetujuan Akun</h2>
      </div>

      {loading ? (
        <p className="empty-state">Memuat…</p>
      ) : pending.length === 0 ? (
        <p className="empty-state">Tidak ada permintaan menunggu.</p>
      ) : (
        pending.map((p) => (
          <div key={p.id} className="list-card" style={{ alignItems: 'flex-start' }}>
            <div className="list-card-main">
              <div className="list-card-title">{p.name || p.id}</div>
              <div className="list-card-sub">{p.id}</div>
              <div className="list-card-sub">
                Kode: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.code}</span>
              </div>
            </div>
            <div className="list-card-actions" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button className="icon-btn" onClick={() => approve(p)} aria-label="Setujui">✅</button>
              <button className="icon-btn" onClick={() => reject(p.id)} aria-label="Tolak">🗑️</button>
            </div>
          </div>
        ))
      )}
    </>
  )
}
