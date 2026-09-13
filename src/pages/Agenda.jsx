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

const CATEGORY_COLORS = {
  Harian: 'blue',
  Acara: 'orange',
  Lainnya: 'gray',
}

export default function Agenda() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'Harian', pj: '', date: '' })

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'desc'))
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
    setForm({ title: '', category: 'Harian', pj: '', date: '' })
    setShowForm(false)
  }

  return (
    <>
      <div className="section-row">
        <h2>Agenda &amp; Kegiatan</h2>
        <button className="btn-accent" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Tutup' : '+ Tambah'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div>
                <label>Judul</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="cth. Babat Rumput Blok Timur"
                />
              </div>
              <div>
                <label>Kategori</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="Harian">Harian</option>
                  <option value="Acara">Acara</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label>Penanggung Jawab</label>
                <input
                  value={form.pj}
                  onChange={(e) => setForm({ ...form, pj: e.target.value })}
                  placeholder="cth. Pak Jaja"
                />
              </div>
              <div>
                <label>Tanggal</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
            <button className="btn" type="submit">Simpan Agenda</button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="empty-state">Memuat…</p>
      ) : events.length === 0 ? (
        <p className="empty-state">Belum ada agenda. Tambahkan yang pertama.</p>
      ) : (
        events.map((ev) => (
          <div key={ev.id} className="list-card" style={{ display: 'block' }}>
            <div className={`tag-label ${CATEGORY_COLORS[ev.category] || 'gray'}`}>
              {(ev.category || 'Lainnya').toUpperCase()}
            </div>
            <div className="list-card-title">{ev.title}</div>
            <div className="list-card-sub">
              PJ: {ev.pj || '—'} · {new Date(ev.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        ))
      )}
    </>
  )
}