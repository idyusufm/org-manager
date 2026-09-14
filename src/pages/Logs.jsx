import React, { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore'
import { db } from '../firebase'

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'activityLogs'), orderBy('createdAt', 'desc'), limit(100))
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <>
      <div className="section-row">
        <h2>Log Aktivitas</h2>
      </div>

      {loading ? (
        <p className="empty-state">Memuat…</p>
      ) : logs.length === 0 ? (
        <p className="empty-state">Belum ada aktivitas tercatat.</p>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="list-card" style={{ display: 'block' }}>
            <div className="list-card-title">{log.description}</div>
            <div className="list-card-sub">
              {log.by} ·{' '}
              {log.createdAt?.toDate
                ? log.createdAt.toDate().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                : '—'}
            </div>
          </div>
        ))
      )}
    </>
  )
}
