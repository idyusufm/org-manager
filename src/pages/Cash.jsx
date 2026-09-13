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

const rupiah = (n) => {
  const sign = n < 0 ? '-' : '+'
  return `${sign} Rp ${Math.abs(n).toLocaleString('id-ID')}`
}

const emptyForm = { description: '', amount: '', type: 'income', date: '' }

export default function Cash() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description || !form.amount || !form.date) return
    const signedAmount =
      form.type === 'expense' ? -Math.abs(Number(form.amount)) : Math.abs(Number(form.amount))
    await addDoc(collection(db, 'transactions'), {
      description: form.description,
      amount: signedAmount,
      date: form.date,
      createdBy: user?.email || 'unknown',
      createdAt: serverTimestamp(),
    })
    setForm(emptyForm)
    setShowForm(false)
  }

  const startEdit = (t) => {
    setEditingId(t.id)
    setEditForm({
      description: t.description,
      amount: String(Math.abs(t.amount)),
      type: t.amount < 0 ? 'expense' : 'income',
      date: t.date,
    })
  }

  const saveEdit = async (id) => {
    const signedAmount =
      editForm.type === 'expense' ? -Math.abs(Number(editForm.amount)) : Math.abs(Number(editForm.amount))
    await updateDoc(doc(db, 'transactions', id), {
      description: editForm.description,
      amount: signedAmount,
      date: editForm.date,
    })
    setEditingId(null)
  }

  const removeTransaction = async (id) => {
    if (!window.confirm('Hapus transaksi ini? Saldo akan dihitung ulang otomatis.')) return
    await deleteDoc(doc(db, 'transactions', id))
  }

  const balance = transactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <>
      <div className="stat-card">
        <div className="label">Total Saldo Makam</div>
        <div className={`value ${balance >= 0 ? 'positive' : 'negative'}`}>
          Rp {Math.abs(balance).toLocaleString('id-ID')}
        </div>
      </div>

      <div className="section-row">
        <h2>Riwayat Transaksi</h2>
        <button className="btn-accent" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Tutup' : '+ Tambah'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div>
                <label>Deskripsi</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="cth. Iuran warga"
                />
              </div>
              <div>
                <label>Jenis</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="income">Pemasukan</option>
                  <option value="expense">Pengeluaran</option>
                </select>
              </div>
              <div>
                <label>Jumlah (Rp)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
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
            <button className="btn" type="submit">Simpan Transaksi</button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="empty-state">Memuat…</p>
      ) : transactions.length === 0 ? (
        <p className="empty-state">Belum ada transaksi. Tambahkan yang pertama.</p>
      ) : (
        transactions.map((t) =>
          editingId === t.id ? (
            <div key={t.id} className="card">
              <div className="form-grid">
                <div>
                  <label>Deskripsi</label>
                  <input
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <label>Jenis</label>
                  <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                    <option value="income">Pemasukan</option>
                    <option value="expense">Pengeluaran</option>
                  </select>
                </div>
                <div>
                  <label>Jumlah (Rp)</label>
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
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
                <button className="btn" onClick={() => saveEdit(t.id)}>Simpan</button>
                <button className="btn-accent" style={{ background: '#9aa0a6' }} onClick={() => setEditingId(null)}>
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <div key={t.id} className={`list-card ${t.amount >= 0 ? 'positive' : 'negative'}`}>
              <div className="list-card-main">
                <div className="list-card-title">{t.description}</div>
                <div className="list-card-sub">
                  {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div className="list-card-right">
                <div className={`list-card-amount ${t.amount >= 0 ? 'positive' : 'negative'}`}>
                  {rupiah(t.amount)}
                </div>
                <div className="list-card-actions">
                  <button className="icon-btn" onClick={() => startEdit(t)} aria-label="Edit">✏️</button>
                  <button className="icon-btn" onClick={() => removeTransaction(t.id)} aria-label="Hapus">🗑️</button>
                </div>
              </div>
            </div>
          )
        )
      )}
    </>
  )
}