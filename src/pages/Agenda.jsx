import React, { useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'

const CATEGORY_COLORS = {
  Harian: 'blue',
  Acara: 'orange',
  Lainnya: 'gray',
}

const emptyForm = { title: '', category: 'Harian', pj: '', date: '' }

export default function Agenda() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)

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
    setForm(emptyForm)
    setShowForm(false)
  }

  const startEdit = (ev) => {
    setEditingId(ev.id)
    setEditForm({ title: ev.title, category: ev.category || 'Harian', pj: ev.pj || '', date: ev.date })
  }

  const saveEdit = async (id) => {
    await updateDoc(doc(db, 'events', id), { ...editForm })
    setEditingId(null)
  }

  const removeEvent = async (id) => {
    if (!window.confirm('Hapus agenda ini?')) return
    await deleteDoc(doc(db, 'events', id))
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
        events.map((ev) =>
          editingId === ev.id ? (
            <div key={ev.id} className="card">
              <div className="form-grid">
                <div>
                  <label>Judul</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label>Kategori</label>
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                    <option value="Harian">Harian</option>
                    <option value="Acara">Acara</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label>Penanggung Jawab</label>
                  <input
                    value={editForm.pj}
                    onChange={(e) => setEditForm({ ...editForm, pj: e.target.value })}
                  />
                </div>
                <div>
                  <label>Tanggal</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={() => saveEdit(ev.id)}>Simpan</button>
                <button className="btn-accent" style={{ background: '#9aa0a6' }} onClick={() => setEditingId(null)}>
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <div key={ev.id} className="list-card" style={{ alignItems: 'flex-start' }}>
              <div className="list-card-main" style={{ flex: 1 }}>
                <div className={`tag-label ${CATEGORY_COLORS[ev.category] || 'gray'}`}>
                  {(ev.category || 'Lainnya').toUpperCase()}
                </div>
                <div className="list-card-title">{ev.title}</div>
                <div className="list-card-sub">
                  PJ: {ev.pj || '—'} · {new Date(ev.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div className="list-card-actions">
                <button className="icon-btn" onClick={() => startEdit(ev)} aria-label="Edit">✏️</button>
                <button className="icon-btn" onClick={() => removeEvent(ev.id)} aria-label="Hapus">🗑️</button>
              </div>
            </div>
          )
        )
      )}
    </>
  )
}