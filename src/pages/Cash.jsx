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

const rupiah = (n) => {
  const sign = n < 0 ? '-' : '+'
  return `${sign} Rp ${Math.abs(n).toLocaleString('id-ID')}`
}

export default function Cash() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', type: 'income', date: '' })

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
    setForm({ description: '', amount: '', type: 'income', date: '' })
    setShowForm(false)
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
        transactions.map((t) => (
          <div key={t.id} className={`list-card ${t.amount >= 0 ? 'positive' : 'negative'}`}>
            <div className="list-card-main">
              <div className="list-card-title">{t.description}</div>
              <div className="list-card-sub">
                {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div className={`list-card-amount ${t.amount >= 0 ? 'positive' : 'negative'}`}>
              {rupiah(t.amount)}
            </div>
          </div>
        ))
      )}
    </>
  )
}