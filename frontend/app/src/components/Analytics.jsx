import React, { useState, useEffect, useRef } from 'react'

// ── Constants ──────────────────────────────────────────────────────────────────

const WS_BASE = 'ws://localhost:8000'

// Cameras to subscribe to (must match backend CAMERAS dict keys)
const SUBSCRIBED_CAMERAS = ['cam1']

const CAMERA_LOCATIONS = {
    cam1: 'Main Entrance',
    cam2: 'Mine Site A',
    cam3: 'Mine Site B',
    cam4: 'Factory Floor',
}

const SEVERITY = {
    CRITICAL: { label: 'CRITICAL', bg: '#7f1d1d', color: '#fca5a5', dot: '#ef4444' },
    HIGH:     { label: 'HIGH',     bg: '#78350f', color: '#fcd34d', dot: '#f59e0b' },
    MEDIUM:   { label: 'MEDIUM',   bg: '#1e3a5f', color: '#93c5fd', dot: '#3b82f6' },
    LOW:      { label: 'LOW',      bg: '#14532d', color: '#86efac', dot: '#22c55e' },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

let _alertCounter = 0

/** Map a raw YOLO event object → UI alert object */
function mapEvent(event) {
    const conf = event.confidence
    const severity =
        conf >= 0.85 ? 'CRITICAL' :
        conf >= 0.70 ? 'HIGH'     :
        conf >= 0.55 ? 'MEDIUM'   : 'LOW'

    const ts   = new Date(event.ts * 1000)
    const time = ts.toLocaleTimeString('en-GB')           // HH:MM:SS
    const date = ts.toISOString().slice(0, 10)            // YYYY-MM-DD
    const label = event.label.charAt(0).toUpperCase() + event.label.slice(1)

    _alertCounter++
    return {
        uid:      `live-${_alertCounter}`,
        id:       `TRK-${String(event.track_id ?? _alertCounter).padStart(3, '0')}`,
        severity,
        title:    `${label} Detected`,
        camera:   event.camera_id.toUpperCase(),
        location: CAMERA_LOCATIONS[event.camera_id] ?? event.camera_id,
        time,
        date,
        confidence: event.confidence,
        label:    event.label,
        track_id: event.track_id,
        tags:     [label, `Conf ${Math.round(conf * 100)}%`, `Track #${event.track_id ?? '?'}`],
        isNew:    true,
    }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const SeverityBadge = ({ level }) => {
    const s = SEVERITY[level]
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minWidth: '72px', padding: '6px 10px',
            borderRadius: '6px', backgroundColor: s.bg,
            gap: '4px', flexShrink: 0,
        }}>
            <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: s.dot, display: 'block',
            }} />
            <span style={{
                color: s.color, fontSize: '0.58rem',
                fontWeight: '800', letterSpacing: '0.1em',
            }}>
                {s.label}
            </span>
        </div>
    )
}

const AlertRow = ({ alert }) => {
    const [open, setOpen]     = useState(false)
    const [flash, setFlash]   = useState(alert.isNew)

    // Remove flash after 1.5 s
    useEffect(() => {
        if (!flash) return
        const id = setTimeout(() => setFlash(false), 1500)
        return () => clearTimeout(id)
    }, [flash])

    const rowBg = flash
        ? 'rgba(59,130,246,0.12)'
        : open ? '#1e293b' : '#141c2e'

    return (
        <div
            style={{
                backgroundColor: rowBg,
                border: `1px solid ${flash ? '#3b82f6' : open ? '#334155' : '#1e293b'}`,
                borderRadius: '8px', overflow: 'hidden',
                transition: 'background 0.6s, border-color 0.6s',
                cursor: 'pointer',
            }}
            onClick={() => setOpen(o => !o)}
        >
            {/* Row header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px' }}>
                <SeverityBadge level={alert.severity} />

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '0.88rem' }}>
                            {alert.title}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: '500' }}>
                            {alert.id}
                        </span>
                        {alert.isNew && flash && (
                            <span style={{
                                backgroundColor: '#1d4ed8', color: '#bfdbfe',
                                fontSize: '0.58rem', fontWeight: '800',
                                padding: '1px 7px', borderRadius: '999px',
                                letterSpacing: '0.1em',
                            }}>
                                NEW
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '5px', flexWrap: 'wrap' }}>
                        {/* Location */}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '0.75rem' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                            </svg>
                            {alert.location}
                        </span>
                        {/* Camera */}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#60a5fa', fontSize: '0.75rem', fontWeight: '600' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
                            </svg>
                            {alert.camera}
                        </span>
                        {/* Time */}
                        <span style={{ color: '#475569', fontSize: '0.72rem' }}>
                            {alert.date}&nbsp;&nbsp;{alert.time}
                        </span>
                    </div>
                </div>

                {/* Chevron */}
                <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="#475569" strokeWidth="2"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s', flexShrink: 0 }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>

            {/* Expanded body */}
            {open && (
                <div
                    style={{
                        borderTop: '1px solid #1e293b',
                        padding: '14px 16px 16px 104px',
                        backgroundColor: '#0f172a',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.6', margin: '0 0 12px 0' }}>
                        YOLO detected a <strong style={{ color: '#f1f5f9' }}>{alert.label}</strong> with{' '}
                        <strong style={{ color: '#f1f5f9' }}>{Math.round(alert.confidence * 100)}%</strong> confidence.
                        Assigned persistent track ID <strong style={{ color: '#60a5fa' }}>#{alert.track_id ?? 'N/A'}</strong>.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#475569', fontSize: '0.7rem' }}>Tags:</span>
                        {alert.tags.map(tag => (
                            <span key={tag} style={{
                                backgroundColor: '#1e293b', color: '#7dd3fc',
                                fontSize: '0.68rem', fontWeight: '600',
                                padding: '2px 10px', borderRadius: '999px',
                                border: '1px solid #334155', letterSpacing: '0.04em',
                            }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Connection status dot ──────────────────────────────────────────────────────

const ConnBadge = ({ status }) => {
    const map = {
        connecting: { color: '#f59e0b', label: 'CONNECTING' },
        live:       { color: '#22c55e', label: 'LIVE' },
        error:      { color: '#ef4444', label: 'DISCONNECTED' },
    }
    const s = map[status] ?? map.error
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
                width: '7px', height: '7px', borderRadius: '50%',
                backgroundColor: s.color, display: 'inline-block',
                boxShadow: status === 'live' ? `0 0 6px ${s.color}` : 'none',
            }} />
            <span style={{ color: s.color, fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.08em' }}>
                {s.label}
            </span>
        </span>
    )
}

// ── Analytics page ─────────────────────────────────────────────────────────────

export const Analytics = () => {
    const [alerts, setAlerts]   = useState([])
    const [connStatus, setConnStatus] = useState('connecting')
    const wsRefs = useRef({})

    useEffect(() => {
        SUBSCRIBED_CAMERAS.forEach(camId => {
            const ws = new WebSocket(`${WS_BASE}/ws/alerts/${camId}`)
            wsRefs.current[camId] = ws

            ws.onopen  = () => setConnStatus('live')
            ws.onerror = () => setConnStatus('error')
            ws.onclose = () => setConnStatus('error')

            ws.onmessage = (msg) => {
                const events = JSON.parse(msg.data)   // array of detection objects
                const mapped = events.map(mapEvent)

                setAlerts(prev => {
                    const updated = [...mapped, ...prev]
                    return updated.slice(0, 100)       // cap at 100 entries
                })
            }
        })

        return () => {
            Object.values(wsRefs.current).forEach(ws => ws.close())
        }
    }, [])

    return (
        <div style={{
            backgroundColor: '#0f172a',
            minHeight: 'calc(100vh - 49px)',
            padding: '24px',
            boxSizing: 'border-box',
        }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ color: '#f1f5f9', fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>
                        Alert Log
                    </h1>
                    <p style={{ color: '#475569', fontSize: '0.78rem', margin: '4px 0 0 0' }}>
                        {alerts.length} detection{alerts.length !== 1 ? 's' : ''} · YOLO live stream
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <ConnBadge status={connStatus} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {Object.entries(SEVERITY).map(([key, s]) => (
                            <span key={key} style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                backgroundColor: s.bg, color: s.color,
                                fontSize: '0.63rem', fontWeight: '700',
                                padding: '3px 10px', borderRadius: '999px',
                                letterSpacing: '0.08em',
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: s.dot, display: 'inline-block' }} />
                                {s.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Alert list */}
            {alerts.length === 0 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '80px 0', gap: '12px',
                }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                    </svg>
                    <span style={{ color: '#334155', fontSize: '0.82rem', letterSpacing: '0.04em' }}>
                        {connStatus === 'connecting' ? 'Connecting to YOLO stream…' : 'Waiting for detections…'}
                    </span>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {alerts.map(alert => (
                        <AlertRow key={alert.uid} alert={alert} />
                    ))}
                </div>
            )}
        </div>
    )
}
