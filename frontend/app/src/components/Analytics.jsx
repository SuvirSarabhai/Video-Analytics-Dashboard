import React, { useState } from 'react'

const SEVERITY = {
    CRITICAL: { label: 'CRITICAL', bg: '#7f1d1d', color: '#fca5a5', dot: '#ef4444' },
    HIGH:     { label: 'HIGH',     bg: '#78350f', color: '#fcd34d', dot: '#f59e0b' },
    MEDIUM:   { label: 'MEDIUM',   bg: '#1e3a5f', color: '#93c5fd', dot: '#3b82f6' },
    LOW:      { label: 'LOW',      bg: '#14532d', color: '#86efac', dot: '#22c55e' },
}

const alerts = [
    {
        id: 'ALT-001',
        severity: 'CRITICAL',
        title: 'Unauthorized Access Detected',
        camera: 'CAM-006',
        location: 'Server Room',
        coords: '28.6144° N, 77.2100° E',
        time: '18:21:04',
        date: '2026-07-22',
        description: 'An unrecognized individual was detected attempting to access the server room. Badge authentication failed 3 consecutive times. Security personnel have been notified.',
        tags: ['Intrusion', 'Access Control'],
    },
    {
        id: 'ALT-002',
        severity: 'CRITICAL',
        title: 'Perimeter Breach — Fence Cut',
        camera: 'CAM-012',
        location: 'Perimeter West',
        coords: '28.6150° N, 77.2112° E',
        time: '18:09:33',
        date: '2026-07-22',
        description: 'Motion detected along perimeter fence. Thermal imaging confirms a physical breach point at the western boundary. Immediate response dispatched.',
        tags: ['Perimeter', 'Physical Breach'],
    },
    {
        id: 'ALT-003',
        severity: 'HIGH',
        title: 'Loitering Detected',
        camera: 'CAM-001',
        location: 'Main Entrance',
        coords: '28.6139° N, 77.2090° E',
        time: '17:58:12',
        date: '2026-07-22',
        description: 'A person has been stationary near the main entrance for over 15 minutes. No badge scan recorded. Flagged for manual review.',
        tags: ['Loitering', 'Suspicious'],
    },
    {
        id: 'ALT-004',
        severity: 'HIGH',
        title: 'Abandoned Object',
        camera: 'CAM-003',
        location: 'Lobby North',
        coords: '28.6141° N, 77.2094° E',
        time: '17:44:50',
        date: '2026-07-22',
        description: 'An unattended bag was detected in the north lobby and has remained stationary for 8 minutes without an associated individual nearby.',
        tags: ['Object Detection', 'Abandoned'],
    },
    {
        id: 'ALT-005',
        severity: 'MEDIUM',
        title: 'Crowd Density Threshold Exceeded',
        camera: 'CAM-002',
        location: 'Parking Lot A',
        coords: '28.6140° N, 77.2092° E',
        time: '17:30:21',
        date: '2026-07-22',
        description: 'Detected 27 individuals in Parking Lot A, exceeding the configured soft limit of 20. No immediate threat, but monitoring continues.',
        tags: ['Crowd', 'Density'],
    },
    {
        id: 'ALT-006',
        severity: 'MEDIUM',
        title: 'Camera Obstruction',
        camera: 'CAM-008',
        location: 'Rooftop East',
        coords: '28.6146° N, 77.2104° E',
        time: '17:15:09',
        date: '2026-07-22',
        description: 'Feed from CAM-008 shows partial obstruction of lens. Possible vandalism or environmental debris. Field team notified to inspect.',
        tags: ['Camera Health', 'Obstruction'],
    },
    {
        id: 'ALT-007',
        severity: 'LOW',
        title: 'Vehicle Speed Anomaly',
        camera: 'CAM-005',
        location: 'Gate 2 Entry',
        coords: '28.6143° N, 77.2098° E',
        time: '16:52:37',
        date: '2026-07-22',
        description: 'A vehicle entered through Gate 2 at an estimated speed exceeding 30 km/h — above the 15 km/h site limit. Driver identity being cross-referenced with entry logs.',
        tags: ['Vehicle', 'Speed'],
    },
    {
        id: 'ALT-008',
        severity: 'LOW',
        title: 'Night Mode Trigger',
        camera: 'CAM-016',
        location: 'Rooftop West',
        coords: '28.6154° N, 77.2120° E',
        time: '16:30:00',
        date: '2026-07-22',
        description: 'Ambient light dropped below threshold. Camera switched to infrared night mode automatically. Feed quality confirmed normal.',
        tags: ['System', 'Night Mode'],
    },
]

const SeverityBadge = ({ level }) => {
    const s = SEVERITY[level]
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '72px',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: s.bg,
            gap: '4px',
            flexShrink: 0,
        }}>
            <span style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                backgroundColor: s.dot,
                display: 'block',
            }} />
            <span style={{
                color: s.color,
                fontSize: '0.58rem',
                fontWeight: '800',
                letterSpacing: '0.1em',
            }}>
                {s.label}
            </span>
        </div>
    )
}

const AlertRow = ({ alert }) => {
    const [open, setOpen] = useState(false)

    return (
        <div
            style={{
                backgroundColor: open ? '#1e293b' : '#141c2e',
                border: `1px solid ${open ? '#334155' : '#1e293b'}`,
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'background 0.2s, border-color 0.2s',
                cursor: 'pointer',
            }}
            onClick={() => setOpen(o => !o)}
        >
            {/* Row header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '14px 16px',
            }}>
                <SeverityBadge level={alert.severity} />

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{
                            color: '#f1f5f9',
                            fontWeight: '600',
                            fontSize: '0.88rem',
                        }}>
                            {alert.title}
                        </span>
                        <span style={{
                            color: '#64748b',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                        }}>
                            {alert.id}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '5px', flexWrap: 'wrap' }}>
                        {/* Location */}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '0.75rem' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                            </svg>
                            {alert.location}
                        </span>
                        {/* Camera ID */}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#60a5fa', fontSize: '0.75rem', fontWeight: '600' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
                            </svg>
                            {alert.camera}
                        </span>
                        {/* Time */}
                        <span style={{ color: '#475569', fontSize: '0.72rem' }}>
                            {alert.date} &nbsp;{alert.time}
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
                        {alert.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#475569', fontSize: '0.7rem' }}>Tags:</span>
                        {alert.tags.map(tag => (
                            <span key={tag} style={{
                                backgroundColor: '#1e293b',
                                color: '#7dd3fc',
                                fontSize: '0.68rem',
                                fontWeight: '600',
                                padding: '2px 10px',
                                borderRadius: '999px',
                                border: '1px solid #334155',
                                letterSpacing: '0.04em',
                            }}>
                                {tag}
                            </span>
                        ))}
                        <span style={{ marginLeft: 'auto', color: '#475569', fontSize: '0.7rem' }}>
                            📍 {alert.coords}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

export const Analytics = () => {
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
                    <h1 style={{ color: '#f1f5f9', fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Alert Log</h1>
                    <p style={{ color: '#475569', fontSize: '0.78rem', margin: '4px 0 0 0' }}>{alerts.length} alerts · Last updated 18:21:04</p>
                </div>
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

            {/* Alert list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {alerts.map(alert => (
                    <AlertRow key={alert.id} alert={alert} />
                ))}
            </div>
        </div>
    )
}
