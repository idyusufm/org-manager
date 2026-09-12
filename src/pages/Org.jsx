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

export default function Org() {
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [memberForm, setMemberForm] = useState({ name: '', role: '', email: '' })
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
    await addDoc(collection(db, 'members'), { ...memberForm, status: 'active' })
    setMemberForm({ name: '', role: '', email: '' })
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
  }

  const toggleTask = async (task) => {
    await updateDoc(doc(db, 'tasks', task.id), { done: !task.done })
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Organization</h1>
          <p>Members and open tasks.</p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 16 }}>Add member</h3>
        <form onSubmit={addMember}>
          <div className="form-grid">
            <div>
              <label>Name</label>
              <input value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} />
            </div>
            <div>
              <label>Role</label>
              <input
                value={memberForm.role}
                onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                placeholder="e.g. Treasurer"
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
              />
            </div>
          </div>
          <button className="btn" type="submit">Add member</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 16 }}>Members ({members.length})</h3>
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : members.length === 0 ? (
          <p className="empty-state">No members yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td><span className="tag">{m.role || 'Member'}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{m.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 16 }}>Add task</h3>
        <form onSubmit={addTask}>
          <div className="form-grid">
            <div>
              <label>Task</label>
              <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
            </div>
            <div>
              <label>Owner</label>
              <input value={taskForm.owner} onChange={(e) => setTaskForm({ ...taskForm, owner: e.target.value })} />
            </div>
          </div>
          <button className="btn" type="submit">Add task</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 16 }}>Tasks</h3>
        {tasks.length === 0 ? (
          <p className="empty-state">No tasks yet.</p>
        ) : (
          <table>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td style={{ width: 24 }}>
                    <input type="checkbox" checked={!!t.done} onChange={() => toggleTask(t)} />
                  </td>
                  <td style={{ textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--text-muted)' : 'var(--text)' }}>
                    {t.title}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
