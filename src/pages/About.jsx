import React from 'react'

const APP_VERSION = '1.1.0'

function TelegramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21.5 4.5L2.5 12l6 2 2 6.5 3-4 5 4 3-16z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" fill="none" /></svg>
  )
}

function GithubIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.53.1.72-.23.72-.51v-1.8c-2.93.64-3.55-1.4-3.55-1.4-.48-1.22-1.17-1.55-1.17-1.55-.96-.65.07-.64.07-.64 1.06.08 1.62 1.09 1.62 1.09.94 1.62 2.47 1.15 3.07.88.1-.68.37-1.15.67-1.42-2.34-.27-4.8-1.17-4.8-5.22 0-1.15.41-2.1 1.08-2.83-.11-.27-.47-1.35.1-2.8 0 0 .88-.28 2.88 1.08a10 10 0 0 1 5.24 0c2-1.36 2.88-1.08 2.88-1.08.57 1.45.21 2.53.1 2.8.67.73 1.08 1.68 1.08 2.83 0 4.06-2.47 4.95-4.82 5.21.38.33.72.97.72 1.96v2.9c0 .28.19.62.73.51A10.5 10.5 0 0 0 12 1.5z" /></svg>
  )
}

function ExternalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3h7v7M21 3l-9 9M5 5h5v0H5v14h14v-5" /></svg>
  )
}

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar-circle" style={{ background: '#229ED9' }}>
              <TelegramIcon />
            </div>
            <div className="list-card-main">
              <div className="list-card-title">Telegram</div>
              <div className="list-card-sub">@zwielichtstern</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>
            Buka di browser
            <ExternalIcon />
          </div>
        </a>

        <a href="https://github.com/idyusufm/simaqom" target="_blank" rel="noopener noreferrer" className="list-card" style={{ marginBottom: 0, textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar-circle" style={{ background: '#1a1a1a' }}>
              <GithubIcon />
            </div>
            <div className="list-card-main">
              <div className="list-card-title">GitHub</div>
              <div className="list-card-sub">idyusufm/simaqom</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>
            Buka di browser
            <ExternalIcon />
          </div>
        </a>
      </div>
    </>
  )
}
