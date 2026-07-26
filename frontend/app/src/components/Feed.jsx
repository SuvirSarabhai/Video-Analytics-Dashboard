import React, { useEffect, useRef, useState } from 'react'

const WS_BASE = 'ws://localhost:8000'

// Cameras that have a real stream (must match camera_state keys in manager.py)
const LIVE_IDS = ['cam1', 'cam2', 'cam3', 'cam4']

const cameras = [
    { id: 'cam1', location: 'Main Entrance', coords: '28.6139° N, 77.2090° E' },
    { id: 'cam2', location: 'Mine Site A', coords: '28.6140° N, 77.2092° E' },
    { id: 'cam3', location: 'Mine Site B', coords: '28.6141° N, 77.2094° E' },
    { id: 'cam4', location: 'Factory Floor', coords: '28.6142° N, 77.2096° E' },
    { id: 'CAM-005', location: 'Gate 2 Entry', coords: '28.6143° N, 77.2098° E' },
    { id: 'CAM-006', location: 'Server Room', coords: '28.6144° N, 77.2100° E' },
    { id: 'CAM-007', location: 'Corridor B', coords: '28.6145° N, 77.2102° E' },
    { id: 'CAM-008', location: 'Rooftop East', coords: '28.6146° N, 77.2104° E' },
    { id: 'CAM-009', location: 'Warehouse Dock', coords: '28.6147° N, 77.2106° E' },
    { id: 'CAM-010', location: 'Emergency Exit', coords: '28.6148° N, 77.2108° E' },
    { id: 'CAM-011', location: 'Stairwell C', coords: '28.6149° N, 77.2110° E' },
    { id: 'CAM-012', location: 'Perimeter West', coords: '28.6150° N, 77.2112° E' },
    { id: 'CAM-013', location: 'Office Floor 2', coords: '28.6151° N, 77.2114° E' },
    { id: 'CAM-014', location: 'Parking Lot B', coords: '28.6152° N, 77.2116° E' },
    { id: 'CAM-015', location: 'Gate 3 Exit', coords: '28.6153° N, 77.2118° E' },
    { id: 'CAM-016', location: 'Rooftop West', coords: '28.6154° N, 77.2120° E' },
]

// ── Single camera card ────────────────────────────────────────────────────────
function CameraCard({ cam }) {
    const canvasRef = useRef(null)
    const wsRef = useRef(null)
    const imgRef = useRef(new Image())
    const [status, setStatus] = useState('offline') // 'offline' | 'connecting' | 'live' | 'error'

    const isLive = LIVE_IDS.includes(cam.id)

    useEffect(() => {
        if (!isLive) return

        setStatus('connecting')

        const ws = new WebSocket(`${WS_BASE}/ws/video/${cam.id}`)
        ws.binaryType = 'arraybuffer'
        wsRef.current = ws

        ws.onopen = () => setStatus('live')
        ws.onerror = () => setStatus('error')
        ws.onclose = () => setStatus('offline')

        ws.onmessage = (event) => {
            // event.data is an ArrayBuffer containing a JPEG
            const blob = new Blob([event.data], { type: 'image/jpeg' })
            const url = URL.createObjectURL(blob)

            imgRef.current.onload = () => {
                const canvas = canvasRef.current
                if (!canvas) return
                const ctx = canvas.getContext('2d')
                ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height)
                URL.revokeObjectURL(url)
            }
            imgRef.current.src = url
        }

        return () => {
            ws.close()
            setStatus('offline')
        }
    }, [cam.id, isLive])

    const dotColor =
        status === 'live' ? '#22c55e' :
            status === 'connecting' ? '#f59e0b' :
                status === 'error' ? '#ef4444' : '#334155'

    const label =
        status === 'live' ? 'LIVE' :
            status === 'connecting' ? 'CONNECTING' :
                status === 'error' ? 'ERROR' : 'NO SIGNAL'

    return (
        <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid #334155',
        }}>
            {/* Video area */}
            <div style={{
                aspectRatio: '16/9',
                backgroundColor: '#0a0f1e',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Canvas — only rendered for live cameras */}
                {isLive ? (
                    <canvas
                        ref={canvasRef}
                        width={640}
                        height={360}
                        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                    />
                ) : (
                    /* Placeholder for non-wired cameras */
                    <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
                            <path d="M23 7l-7 5 7 5V7z" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                        <span style={{ color: '#334155', fontSize: '0.6rem', letterSpacing: '0.1em' }}>NO SIGNAL</span>
                    </div>
                )}

                {/* Status badge — top left */}
                <div style={{
                    position: 'absolute', top: '6px', left: '6px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    padding: '2px 6px', borderRadius: '4px',
                }}>
                    <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: dotColor,
                        display: 'inline-block',
                        boxShadow: status === 'live' ? `0 0 6px ${dotColor}` : 'none',
                    }} />
                    <span style={{ color: '#f8fafc', fontSize: '0.58rem', fontWeight: '700', letterSpacing: '0.08em' }}>
                        {label}
                    </span>
                </div>

                {/* Camera ID badge — top right */}
                <div style={{
                    position: 'absolute', top: '6px', right: '6px',
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    padding: '2px 6px', borderRadius: '4px',
                }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.58rem', fontWeight: '600' }}>
                        {cam.id.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Camera info */}
            <div style={{ padding: '7px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                        color: '#f1f5f9', fontWeight: '600', fontSize: '0.72rem',
                        letterSpacing: '0.02em', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {cam.location}
                    </span>
                    <span style={{
                        color: '#60a5fa', fontSize: '0.62rem', fontWeight: '700',
                        letterSpacing: '0.05em', marginLeft: '8px', flexShrink: 0,
                    }}>
                        {cam.id.toUpperCase()}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span style={{ color: '#64748b', fontSize: '0.6rem', letterSpacing: '0.02em' }}>
                        {cam.coords}
                    </span>
                </div>
            </div>
        </div>
    )
}

// ── Feed page ─────────────────────────────────────────────────────────────────
export const Feed = () => {
    return (
        <div style={{
            backgroundColor: '#0f172a',
            minHeight: 'calc(100vh - 49px)',
            padding: '16px',
            boxSizing: 'border-box',
        }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
            }}>
                {cameras.map((cam) => (
                    <CameraCard key={cam.id} cam={cam} />
                ))}
            </div>
        </div>
    )
}
