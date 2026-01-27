import React from 'react'
import { Minus, Square, X, Search } from 'lucide-react'

function Header() {
  const handleMinimize = () => window.electronAPI?.minimizeWindow()
  const handleMaximize = () => window.electronAPI?.maximizeWindow()
  const handleClose = () => window.electronAPI?.closeWindow()

  const buttonStyle = {
    padding: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#a0a0b0',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  return (
    <header
      style={{
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a24',
        borderBottom: '1px solid #2a2a3a',
        padding: '0 16px',
        WebkitAppRegion: 'drag'
      }}
    >
      {/* Search bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#252532',
          borderRadius: '8px',
          padding: '8px 12px',
          width: '280px',
          WebkitAppRegion: 'no-drag'
        }}
      >
        <Search size={16} style={{ color: '#a0a0b0' }} />
        <input
          type="text"
          placeholder="Search programs..."
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            color: '#f5f5f5',
            width: '100%'
          }}
        />
      </div>

      {/* Window controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={handleMinimize}
          style={buttonStyle}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#252532'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Minus size={16} />
        </button>
        <button
          onClick={handleMaximize}
          style={buttonStyle}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#252532'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Square size={14} />
        </button>
        <button
          onClick={handleClose}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#a0a0b0'
          }}
        >
          <X size={16} />
        </button>
      </div>
    </header>
  )
}

export default Header
