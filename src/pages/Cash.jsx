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
import { logActivity } from '../logActivity'

const rupiah = (n) => {
  const sign = n < 0 ? '-' : '+'
  return `${sign} Rp ${Math.abs(n).toLocaleString('id-ID')}`
}

const emptyForm = { description: '', amount: '', type: 'income', date: '' }

const PERIODS = {
  week: 'Minggu Ini (7 hari)',
  month: 'Bulan Ini',
  year: 'Tahun Ini',
  all: 'Semua Data',
}

function filterByPeriod(transactions, period) {
  if (period === 'all') return transactions
  const now = new Date()
  return transactions.filter((t) => {
    const d = new Date(t.date)
    if (period === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(now.getDate() - 7)
      return d >= weekAgo && d <= now
    }
    if (period === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }
    if (period === 'year') {
      return d.getFullYear() === now.getFullYear()
    }
    return true
  })
}

function downloadCsv(transactions, period) {
  const header = ['Tanggal', 'Deskripsi', 'Jenis', 'Jumlah (Rp)']
  const rows = transactions.map((t) => [
    t.date,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.amount >= 0 ? 'Pemasukan' : 'Pengeluaran',
    Math.abs(t.amount),
  ])
  const balance = transactions.reduce((sum, t) => sum + t.amount, 0)
  rows.push([])
  rows.push(['', '', 'Saldo Akhir', balance])

  const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const today = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `kas-simaqom-${period}-${today}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function Cash() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [showExport, setShowExport] = useState(false)
  const [exportPeriod, setExportPeriod] = useState('month')

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
    await logActivity(user, 'add', `Menambah transaksi "${form.description}" (${rupiah(signedAmount)})`)
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
    await logActivity(user, 'edit', `Mengubah transaksi "${editForm.description}"`)
    setEditingId(null)
  }

  const removeTransaction = async (id, description) => {
    if (!window.confirm('Hapus transaksi ini? Saldo akan dihitung ulang otomatis.')) return
    await deleteDoc(doc(db, 'transactions', id))
    await logActivity(user, 'delete', `Menghapus transaksi "${description}"`)
  }

  const handleExport = async () => {
    const filtered = filterByPeriod(transactions, exportPeriod)
    if (filtered.length === 0) {
      alert('Tidak ada transaksi pada periode ini.')
      return
    }
    downloadCsv(filtered, exportPeriod)
    await logActivity(user, 'export', `Mengekspor data Kas (${PERIODS[exportPeriod]}, ${filtered.length} transaksi)`)
    setShowExport(false)
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-accent" style={{ background: 'var(--green)' }} onClick={() => setShowExport((s) => !s)}>
            {showExport ? 'Tutup' : '⬇ Ekspor'}
          </button>
          <button className="btn-accent" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Tutup' : '+ Tambah'}
          </button>
        </div>
      </div>

      {showExport && (
        <div className="card">
          <label>Pilih Periode</label>
          <select value={exportPeriod} onChange={(e) => setExportPeriod(e.target.value)} style={{ marginBottom: 14 }}>
            {Object.entries(PERIODS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button className="btn" onClick={handleExport}>Unduh CSV</button>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
            File CSV bisa dibuka langsung di Google Sheets: buka sheets.google.com → File → Import → Upload, lalu pilih file yang terunduh.
          </p>
        </div>
      )}

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
                  <button className="icon-btn" onClick={() => removeTransaction(t.id, t.description)} aria-label="Hapus">🗑️</button>
                </div>
              </div>
            </div>
          )
        )
      )}
    </>
  )
}
