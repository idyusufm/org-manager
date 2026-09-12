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

const currency = (n) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

export default function Cash() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ description: '', amount: '', type: 'income', category: '', date: '' })

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
      category: form.category || 'General',
      date: form.date,
      createdBy: user?.email || 'unknown',
      createdAt: serverTimestamp(),
    })
    setForm({ description: '', amount: '', type: 'income', category: '', date: '' })
  }

  const balance = transactions.reduce((sum, t) => sum + t.amount, 0)
  const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Cash</h1>
          <p>Income, expenses and running balance.</p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat">
          <div className="label">Balance</div>
          <div className={`value ${balance >= 0 ? 'positive' : 'negative'}`}>{currency(balance)}</div>
        </div>
        <div className="stat">
          <div className="label">Income</div>
          <div className="value positive">{currency(income)}</div>
        </div>
        <div className="stat">
          <div className="label">Expense</div>
          <div className="value negative">{currency(expense)}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 16 }}>Add transaction</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label>Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Member dues — March"
              />
            </div>
            <div>
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label>Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Dues, Supplies"
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
          </div>
          <button className="btn" type="submit">Add entry</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 16 }}>Ledger</h3>
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="empty-state">No transactions yet. Add the first one above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Added by</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.description}</td>
                  <td><span className="tag">{t.category}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.createdBy}</td>
                  <td className={`amount ${t.amount >= 0 ? 'positive' : 'negative'}`}>
                    {currency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
