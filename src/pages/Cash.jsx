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
  return sign + ' Rp ' + Math.abs(n).toLocaleString('id-ID')
}

const FUNDS = { kas: 'Kas', infaq: 'Infaq', kegiatan: 'Lainnya' }
const NEW_EVENT_SENTINEL = '__new__'

const emptyForm = { description: '', amount: '', type: 'income', date: '', eventId: '' }
const emptyNewEvent = { title: '', category: 'Acara', pj: '', date: '' }

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
  const header = ['Tanggal', 'Deskripsi', 'Kegiatan', 'Jenis', 'Jumlah (Rp)']
  const rows = transactions.map((t) => [
    t.date,
    '"' + (t.description || '').replace(/"/g, '""') + '"',
    '"' + (t.eventTitle || '') + '"',
    t.amount >= 0 ? 'Pemasukan' : 'Pengeluaran',
    Math.abs(t.amount),
  ])
  const balance = transactions.reduce((sum, t) => sum + t.amount, 0)
  rows.push([])
  rows.push(['', '', '', 'Saldo Akhir', balance])
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const today = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = fund + '-simaqom-' + period + '-' + today + '.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function Cash() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFund, setActiveFund] = useState('kas')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [newEventForm, setNewEventForm] = useState(emptyNewEvent)
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

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const fundTransactions = transactions.filter((t) => (t.fund || 'kas') === activeFund)
  const balance = fundTransactions.reduce((sum, t) => sum + t.amount, 0)

  const handleEventSelect = (value, isEditForm) => {
    if (value === NEW_EVENT_SENTINEL) {
      setNewEventForm(emptyNewEvent)
    }
    if (isEditForm) {
      setEditForm({ ...editForm, eventId: value })
    } else {
      setForm({ ...form, eventId: value })
    }
  }

  const createEventAndSelect = async (isEditForm) => {
    if (!newEventForm.title || !newEventForm.date) return
    const ref = await addDoc(collection(db, 'events'), {
      ...newEventForm,
      createdBy: user?.email || 'unknown',
      createdAt: serverTimestamp(),
    })
    await logActivity(user, 'add', 'Menambah agenda "' + newEventForm.title + '" (dari halaman Kas)')
    if (isEditForm) {
      setEditForm({ ...editForm, eventId: ref.id })
    } else {
      setForm({ ...form, eventId: ref.id })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description || !form.amount || !form.date) return
    if (activeFund === 'kegiatan' && (!form.eventId || form.eventId === NEW_EVENT_SENTINEL)) return
    const signedAmount = form.type === 'expense' ? -Math.abs(Number(form.amount)) : Math.abs(Number(form.amount))
    const selectedEvent = events.find((ev) => ev.id === form.eventId)
    await addDoc(collection(db, 'transactions'), {
      description: form.description,
      amount: signedAmount,
      date: form.date,
      fund: activeFund,
      eventId: activeFund === 'kegiatan' ? form.eventId : null,
      eventTitle: activeFund === 'kegiatan' ? (selectedEvent ? selectedEvent.title : '') : null,
      createdBy: user?.email || 'unknown',
      createdAt: serverTimestamp(),
    })
    await logActivity(user, 'add', 'Menambah transaksi ' + FUNDS[activeFund] + ' "' + form.description + '"')
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
      eventId: t.eventId || '',
    })
  }

  const saveEdit = async (id) => {
    if (activeFund === 'kegiatan' && (!editForm.eventId || editForm.eventId === NEW_EVENT_SENTINEL)) return
    const signedAmount = editForm.type === 'expense' ? -Math.abs(Number(editForm.amount)) : Math.abs(Number(editForm.amount))
    const selectedEvent = events.find((ev) => ev.id === editForm.eventId)
    await updateDoc(doc(db, 'transactions', id), {
      description: editForm.description,
      amount: signedAmount,
      date: editForm.date,
      eventId: activeFund === 'kegiatan' ? editForm.eventId : null,
      eventTitle: activeFund === 'kegiatan' ? (selectedEvent ? selectedEvent.title : '') : null,
    })
    await logActivity(user, 'edit', 'Mengubah transaksi ' + FUNDS[activeFund] + ' "' + editForm.description + '"')
    setEditingId(null)
  }

  const removeTransaction = async (id, description) => {
    if (!window.confirm('Hapus transaksi ini? Saldo akan dihitung ulang otomatis.')) return
    await deleteDoc(doc(db, 'transactions', id))
    await logActivity(user, 'delete', 'Menghapus transaksi ' + FUNDS[activeFund] + ' "' + description + '"')
  }

  const handleExport = async () => {
    const filtered = filterByPeriod(fundTransactions, exportPeriod)
    if (filtered.length === 0) {
      alert('Tidak ada transaksi pada periode ini.')
      return
    }
    downloadCsv(filtered, activeFund, exportPeriod)
    await logActivity(user, 'export', 'Mengekspor data ' + FUNDS[activeFund])
    setShowExport(false)
  }

  const EventSelect = ({ value, onChange }) => (
    <select value={value} onChange={onChange}>
      <option value="">Pilih kegiatan…</option>
      {events.map((ev) => (
        <option key={ev.id} value={ev.id}>{ev.title}</option>
      ))}
      <option value={NEW_EVENT_SENTINEL}>+ Tambah Agenda Baru</option>
    </select>
  )

  const renderTransactionList = (list) =>
    list.map((t) =>
      editingId === t.id ? (
        <div key={t.id} className="card">
          <div className="form-grid">
            <div>
              <label>Deskripsi</label>
              <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
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
              <input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
            </div>
            <div>
              <label>Tanggal</label>
              <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
            </div>
            {activeFund === 'kegiatan' && (
              <div>
                <label>Kegiatan</label>
                <EventSelect value={editForm.eventId} onChange={(e) => handleEventSelect(e.target.value, true)} />
              </div>
            )}
          </div>

          {activeFund === 'kegiatan' && editForm.eventId === NEW_EVENT_SENTINEL && (
            <div className="card" style={{ background: 'var(--bg)' }}>
              <div className="form-grid">
                <div>
                  <label>Judul Agenda</label>
                  <input value={newEventForm.title} onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })} />
                </div>
                <div>
                  <label>Tanggal</label>
                  <input type="date" value={newEventForm.date} onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })} />
                </div>
              </div>
              <button type="button" className="btn" onClick={() => createEventAndSelect(true)}>Simpan Agenda & Pilih</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => saveEdit(t.id)}>Simpan</button>
            <button className="btn-accent" style={{ background: '#9aa0a6' }} onClick={() => setEditingId(null)}>Batal</button>
          </div>
        </div>
      ) : (
        <div key={t.id} className={'list-card ' + (t.amount >= 0 ? 'positive' : 'negative')}>
          <div className="list-card-main">
            <div className="list-card-title">{t.description}</div>
            <div className="list-card-sub">
              {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <div className="list-card-right">
            <div className={'list-card-amount ' + (t.amount >= 0 ? 'positive' : 'negative')}>{rupiah(t.amount)}</div>
            <div className="list-card-actions">
              <button className="icon-btn" onClick={() => startEdit(t)} aria-label="Edit">Edit</button>
              <button className="icon-btn" onClick={() => removeTransaction(t.id, t.description)} aria-label="Hapus">Hapus</button>
            </div>
          </div>
        </div>
      )
    )

  const renderKegiatanGroups = () => {
    const groups = {}
    fundTransactions.forEach((t) => {
      const key = t.eventId || 'none'
      if (!groups[key]) groups[key] = { title: t.eventTitle || 'Tanpa Kegiatan', items: [] }
      groups[key].items.push(t)
    })
    const keys = Object.keys(groups)
    if (keys.length === 0) return <p className="empty-state">Belum ada transaksi Lainnya.</p>
    return keys.map((key) => {
      const group = groups[key]
      const subtotal = group.items.reduce((sum, t) => sum + t.amount, 0)
      return (
        <div key={key} style={{ marginBottom: 22 }}>
          <div className="section-row" style={{ marginBottom: 8 }}>
            <h2 style={{ fontSize: 15 }}>{group.title}</h2>
            <div className={'list-card-amount ' + (subtotal >= 0 ? 'positive' : 'negative')}>{rupiah(subtotal)}</div>
          </div>
          {renderTransactionList(group.items)}
        </div>
      )
    })
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {Object.entries(FUNDS).map(([key, label]) => (
          <button key={key} className={'fund-tab ' + (activeFund === key ? 'active' : '')} onClick={() => { setActiveFund(key); setShowForm(false); setShowExport(false); setEditingId(null); setForm(emptyForm) }}>
            {label}
          </button>
        ))}
      </div>

      <div className="stat-card">
        <div className="label">Total Saldo {FUNDS[activeFund]}</div>
        <div className={'value ' + (balance >= 0 ? 'positive' : 'negative')}>
          Rp {Math.abs(balance).toLocaleString('id-ID')}
        </div>
      </div>

      <div className="section-row">
        <h2>Riwayat {FUNDS[activeFund]}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-accent" style={{ background: 'var(--green)' }} onClick={() => setShowExport((s) => !s)}>
            {showExport ? 'Tutup' : 'Ekspor'}
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
        </div>
      )}

      {showForm && (
        <div className="card">
          {activeFund === 'kegiatan' && (
            <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 10 }}>
              Pilih kegiatan dari agenda yang sudah ada, atau tambahkan agenda baru langsung dari sini.
            </p>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div>
                <label>Deskripsi</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={activeFund === 'kegiatan' ? 'cth. Iuran Agustusan' : 'cth. Iuran warga'} />
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
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label>Tanggal</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              {activeFund === 'kegiatan' && (
                <div>
                  <label>Kegiatan</label>
                  <EventSelect value={form.eventId} onChange={(e) => handleEventSelect(e.target.value, false)} />
                </div>
              )}
            </div>

            {activeFund === 'kegiatan' && form.eventId === NEW_EVENT_SENTINEL && (
              <div className="card" style={{ background: 'var(--bg)' }}>
                <div className="form-grid">
                  <div>
                    <label>Judul Agenda</label>
                    <input value={newEventForm.title} onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })} placeholder="cth. Peringatan Agustusan" />
                  </div>
                  <div>
                    <label>Kategori</label>
                    <select value={newEventForm.category} onChange={(e) => setNewEventForm({ ...newEventForm, category: e.target.value })}>
                      <option value="Harian">Harian</option>
                      <option value="Acara">Acara</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label>Penanggung Jawab</label>
                    <input value={newEventForm.pj} onChange={(e) => setNewEventForm({ ...newEventForm, pj: e.target.value })} />
                  </div>
                  <div>
                    <label>Tanggal</label>
                    <input type="date" value={newEventForm.date} onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })} />
                  </div>
                </div>
                <button type="button" className="btn" onClick={() => createEventAndSelect(false)}>Simpan Agenda & Pilih</button>
              </div>
            )}

            <button className="btn" type="submit">Simpan Transaksi</button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="empty-state">Memuat…</p>
      ) : activeFund === 'kegiatan' ? (
        renderKegiatanGroups()
      ) : fundTransactions.length === 0 ? (
        <p className="empty-state">Belum ada transaksi {FUNDS[activeFund]}.</p>
      ) : (
        renderTransactionList(fundTransactions)
      )}
    </>
  )
}
