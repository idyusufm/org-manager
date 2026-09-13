import React, { useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="currentColor" />
    </svg>
  )
}

export default function Org() {
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [memberForm, setMemberForm] = useState({ name: '', role: '', phone: '' })
  const [taskForm, setTaskForm] = useState({ title: '', owner: '' })

  useEffect(() => {
    const mq = query(collection(db, 'members'), orderBy('name', 'asc'))
    const tq = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
    const unsub1 = onSnapshot(mq, (snap) => {
      setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    const unsub2 = onSnapshot(tq, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => {
      unsub1()
      unsub2()
    }
  }, [])

  const addMember = async (e) => {
    e.preventDefault()
    if (!memberForm.name) return
    await addDoc(collection(db, 'members'), { ...memberForm })
    setMemberForm({ name: '', role: '', phone: '' })
    setShowMemberForm(false)
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!taskForm.title) return
    await addDoc(collection(db, 'tasks'), {
      ...taskForm,
      done: false,
      createdAt: serverTimestamp(),
    })
    setTaskForm({ title: '', owner: '' })
    setShowTaskForm(false)
  }

  const toggleTask = async (task) => {
    await updateDoc(doc(db, 'tasks', task.id), { done: !task.done })
  }

  return (
    <>
      <div className="section-row">
        <h2>Struktur Organisasi</h2>
        <button className="btn-accent" onClick={() => setShowMemberForm((s) => !s)}>
          {showMemberForm ? 'Tutup' : '+ Tambah'}
        </button>
      </div>

      {showMemberForm && (
        <div className="card">
          <form onSubmit={addMember}>
            <div className="form-grid">
              <div>
                <label>Nama</label>
                <input value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} />
              </div>
              <div>
                <label>Jabatan</label>
                <input
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  placeholder="cth. Ketua Pengelola"
                />
              </div>
              <div>
                <label>No. HP</label>
                <input
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  placeholder="cth. 0812-3456-7890"
                />
              </div>
            </div>
            <button className="btn" type="submit">Simpan Pengurus</button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="empty-state">Memuat…</p>
      ) : members.length === 0 ? (
        <p className="empty-state">Belum ada pengurus.</p>
      ) : (
        members.map((m) => (
          <div key={m.id} className="member-card">
            <div className="avatar-circle">
              <PersonIcon />
            </div>
            <div>
              <div className="list-card-title">{m.name}</div>
              <div className="list-card-sub">
                {m.role || 'Anggota'}
                {m.phone ? ` (${m.phone})` : ''}
              </div>
            </div>
          </div>
        ))
      )}

      <div className="section-row" style={{ marginTop: 28 }}>
        <h2>Tugas</h2>
        <button className="btn-accent" onClick={() => setShowTaskForm((s) => !s)}>
          {showTaskForm ? 'Tutup' : '+ Tambah'}
        </button>
      </div>

      {showTaskForm && (
        <div className="card">
          <form onSubmit={addTask}>
            <div className="form-grid">
              <div>
                <label>Judul Tugas</label>
                <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
              </div>
              <div>
                <label>Penanggung Jawab</label>
                <input value={taskForm.owner} onChange={(e) => setTaskForm({ ...taskForm, owner: e.target.value })} />
              </div>
            </div>
            <button className="btn" type="submit">Simpan Tugas</button>
          </form>
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="empty-state">Belum ada tugas.</p>
      ) : (
        tasks.map((t) => (
          <div key={t.id} className="list-card" style={{ borderLeftColor: t.done ? 'var(--green)' : 'var(--tag-gray)' }}>
            <div className="checkbox-row">
              <input type="checkbox" checked={!!t.done} onChange={() => toggleTask(t)} />
              <span style={{ textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--text-muted)' : 'var(--text)' }}>
                {t.title}
              </span>
            </div>
            <div className="list-card-sub">{t.owner}</div>
          </div>
        ))
      )}
    </>
  )
}