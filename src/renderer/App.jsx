import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Programs from './pages/Programs'
import Monitor from './pages/Monitor'
import Recommendations from './pages/Recommendations'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'programs':
        return <Programs />
      case 'monitor':
        return <Monitor />
      case 'recommendations':
        return <Recommendations />
      default:
        return <Dashboard />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0f0f14' }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App
