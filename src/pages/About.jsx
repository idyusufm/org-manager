import React, { useState } from 'react'

const APP_VERSION = '1.1.0'

function TelegramIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21.5 4.5L2.5 12l6 2 2 6.5 3-4 5 4 3-16z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" fill="none" /></svg>
  )
}

function GithubIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.53.1.72-.23.72-.51v-1.8c-2.93.64-3.55-1.4-3.55-1.4-.48-1.22-1.17-1.55-1.17-1.55-.96-.65.07-.64.07-.64 1.06.08 1.62 1.09 1.62 1.09.94 1.62 2.47 1.15 3.07.88.1-.68.37-1.15.67-1.42-2.34-.27-4.8-1.17-4.8-5.22 0-1.15.41-2.1 1.08-2.83-.11-.27-.47-1.35.1-2.8 0 0 .88-.28 2.88 1.08a10 10 0 0 1 5.24 0c2-1.36 2.88-1.08 2.88-1.08.57 1.45.21 2.53.1 2.8.67.73 1.08 1.68 1.08 2.83 0 4.06-2.47 4.95-4.82 5.21.38.33.72.97.72 1.96v2.9c0 .28.19.62.73.51A10.5 10.5 0 0 0 12 1.5z" /></svg>
  )
}

export default function About() {
  const [copied, setCopied] = useState(false)

  const copyTelegramLink = async () => {
    const link = 'https://t.me/zwielichtstern'
    try {
      await navigator.clipboard.writeText(link)
    } catch (e) {
      // Clipboard API can be blocked in some WebViews; ignore silently.
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

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

      <div className="card" style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
        <button onClick={copyTelegramLink} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div className="avatar-circle" style={{ background: '#229ED9', width: 52, height: 52 }}>
            <TelegramIcon />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Telegram</span>
        </button>

        <a href="https://github.com/idyusufm/simaqom" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div className="avatar-circle" style={{ background: '#1a1a1a', width: 52, height: 52 }}>
            <GithubIcon />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>GitHub</span>
        </a>
      </div>

      {copied && (
        <p style={{ textAlign: 'center', color: 'var(--green)', fontSize: 13 }}>
          Link disalin! Buka browser lalu tempel untuk mengunjungi @zwielichtstern.
        </p>
      )}
    </>
  )
}
