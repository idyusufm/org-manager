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

const FUNDS = {
  kas: 'Kas',
  infaq: 'Infaq',
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

function downloadCsv(transactions, fund, period) {
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
  a.download = `${fund}-simaqom-${period}-${today}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function Cash() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFund, setActiveFund] = useState('kas')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [showExport, setShowExport] = useState(false)
  const [exportPeriod, setExportPeriod] = useState('month')

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, fund: 'kas', ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const fundTransactions = transactions.filter((t) => (t.fund || 'kas') === activeFund)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description || !form.amount || !form.date) return
    const signedAmount =
      form.type === 'expense' ? -Math.abs(Number(form.amount)) : Math.abs(Number(form.amount))
    await addDoc(collection(db, 'transactions'), {
      description: form.description,
      amount: signedAmount,
      date: form.date,
      fund: activeFund,
      createdBy: user?.email || 'unknown',
      createdAt: serverTimestamp(),
    })
    await logActivity(user, 'add', `Menambah transaksi ${FUNDS[activeFund]} "${form.description}" (${rupiah(signedAmount)})`)
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
    await logActivity(user, 'edit', `Mengubah transaksi ${FUNDS[activeFund]} "${editForm.description}"`)
    setEditingId(null)
  }

  const removeTransaction = async (id, description) => {
    if (!window.confirm('Hapus transaksi ini? Saldo akan dihitung ulang otomatis.')) return
    await deleteDoc(doc(db, 'transactions', id))
    await logActivity(user, 'delete', `Menghapus transaksi ${FUNDS[activeFund]} "${description}"`)
  }

  const handleExport = async () => {
    const filtered = filterByPeriod(fundTransactions, exportPeriod)
    if (filtered.length === 0) {
      alert('Tidak ada transaksi pada periode ini.')
      return
    }
    downloadCsv(filtered, activeFund, exportPeriod)
    await logActivity(user, 'export', `Mengekspor data ${FUNDS[activeFund]} (${PERIODS[exportPeriod]}, ${filtered.length} transaksi)`)
    setShowExport(false)
  }

  const balance = fundTransactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <>
      <div className="theme-row" style={{ padding: 0, marginBottom: 18 }}>
        {Object.entries(FUNDS).map(([key, label]) => (
          <button
            key={key}
            className={`theme-btn ${activeFund === key ? 'active' : ''}`}
            style={{ padding: '10px 4px' }}
            onClick={() => {
              setActiveFund(key)
              setShowForm(false)
              setShowExport(false)
              setEditingId(null)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="stat-card">
        <div className="label">
          {activeFund === 'kas' ? 'Total Saldo Kas' : 'Total Saldo Infaq'}
        </div>
        <div className={`value ${balance >= 0 ? 'positive' : 'negative'}`}>
          Rp {Math.abs(balance).toLocaleString('id-ID')}
        </div>
      </div>

      <div className="section-row">
        <h2>Riwayat {FUNDS[activeFund]}</h2>
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
          <button className="btn" onClick={handleExport}>Unduh CSV ({FUNDS[activeFund]})</button>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
            File CSV bisa dibuka langsung di Google Sheets: buka sheets.google.com → File → Import → Upload, lalu pilih file yang terunduh.
          </p>
        </div>
      )}

      {showForm && (
        <div className="card">
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            Transaksi ini akan dicatat sebagai <strong>{FUNDS[activeFund]}</strong>.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div>
                <label>Deskripsi</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={activeFund === 'kas' ? 'cth. Iuran warga' : 'cth. Infaq peziarah'}
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
      ) : fundTransactions.length === 0 ? (
        <p className="empty-state">Belum ada transaksi {FUNDS[activeFund]}. Tambahkan yang pertama.</p>
      ) : (
        fundTransactions.map((t) =>
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
