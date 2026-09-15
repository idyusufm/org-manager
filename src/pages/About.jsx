import React from 'react'

const APP_VERSION = '1.0.0'

export default function About() {
  return (
    <>
      <div className="section-row">
        <h2>Tentang Aplikasi</h2>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '32px 18px' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🏛️</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.02em' }}>SIMAQOM</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Versi {APP_VERSION}</div>
      </div>

      <div className="card">
        <a href="https://t.me/zwielichtstern" target="_blank" rel="noopener noreferrer" className="list-card" style={{ marginBottom: 10, textDecoration: 'none' }}>
          <div className="list-card-main">
            <div className="list-card-title">Telegram</div>
            <div className="list-card-sub">@zwielichtstern</div>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>Open</span>
        </a>

        <a href="https://github.com/idyusufm/simaqom" target="_blank" rel="noopener noreferrer" className="list-card" style={{ marginBottom: 0, textDecoration: 'none' }}>
          <div className="list-card-main">
            <div className="list-card-title">GitHub</div>
            <div className="list-card-sub">idyusufm/simaqom</div>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>Open</span>
        </a>
      </div>
    </>
  )
}
