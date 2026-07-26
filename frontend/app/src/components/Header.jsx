import React from 'react'
import { Link } from 'react-router-dom'

export const Header = ({ title }) => {
    return (
        <header
            style={{
                backgroundColor: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                padding: '12px 24px',
                gap: '24px'
            }}
        >
            {title && (
                <Link
                    to="/"
                    style={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        whiteSpace: 'nowrap',
                        textDecoration: 'none'
                    }}
                >
                    {title}
                </Link>
            )}

            <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Link
                    to="/feed"
                    style={{ color: 'white', textDecoration: 'none' }}
                >
                    Feed
                </Link>

                <Link
                    to="/analytics"
                    style={{ color: 'white', textDecoration: 'none' }}
                >
                    Analytics
                </Link>
            </nav>
        </header>
    )
}