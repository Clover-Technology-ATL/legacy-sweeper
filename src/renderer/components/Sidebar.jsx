import React from 'react'
import { LayoutDashboard, Package, Activity, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'programs', label: 'Programs', icon: Package },
  { id: 'monitor', label: 'Monitor', icon: Activity },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb }
]

function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }) {
  return (
    <aside
      style={{
        width: collapsed ? '64px' : '220px',
        backgroundColor: '#1a1a24',
        borderRight: '1px solid #2a2a3a',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease'
      }}
    >
      {/* Logo - click to go to Dashboard */}
      <button
        onClick={() => setActiveTab('dashboard')}
        style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid #2a2a3a',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#252532'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#a855f7' }}>
          {collapsed ? 'LS' : 'Legacy Sweeper'}
        </span>
      </button>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: '16px' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                border: 'none',
                borderRight: isActive ? '2px solid #a855f7' : '2px solid transparent',
                backgroundColor: isActive ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                color: isActive ? '#a855f7' : '#a0a0b0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#252532'
                  e.currentTarget.style.color = '#f5f5f5'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#a0a0b0'
                }
              }}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid #2a2a3a',
          border: 'none',
          backgroundColor: 'transparent',
          color: '#a0a0b0',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#252532'
          e.currentTarget.style.color = '#f5f5f5'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = '#a0a0b0'
        }}
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </aside>
  )
}

export default Sidebar
