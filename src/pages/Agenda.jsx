import React, { useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'

export default function Agenda() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', date: '', time: '', location: '', notes: '' })

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.date) return
    await addDoc(collection(db, 'events'), {
      ...form,
      createdBy: user?.email || 'unknown',
      createdAt: serverTimestamp(),
    })
    setForm({ title: '', date: '', time: '', location: '', notes: '' })
  }

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = events.filter((e) => e.date >= today)
  const past = events.filter((e) => e.date < today)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Agenda</h1>
          <p>Meetings, deadlines and events.</p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 16 }}>Add event</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label>Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Board meeting"
              />
            </div>
            <div>
              <label>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label>Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
            <div>
              <label>Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Room 2 / Zoom"
              />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label>Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Agenda items, links, context"
            />
          </div>
          <button className="btn" type="submit">Add event</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 16 }}>Upcoming</h3>
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="empty-state">Nothing scheduled. Add an event above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Title</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.date}</td>
                  <td>{ev.time || '—'}</td>
                  <td>{ev.title}</td>
                  <td>{ev.location || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {past.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 14, fontSize: 16, color: 'var(--text-muted)' }}>Past</h3>
          <table>
            <tbody>
              {past.slice(0, 8).map((ev) => (
                <tr key={ev.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{ev.date}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{ev.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
