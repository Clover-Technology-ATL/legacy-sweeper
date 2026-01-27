import React, { useState, useEffect } from 'react'
import { Search, Trash2, ChevronUp, ChevronDown, X, CheckCircle, Loader, AlertCircle, RefreshCw, FolderOpen } from 'lucide-react'

const statusColors = {
  recent: { bg: 'rgba(34, 197, 94, 0.1)', text: '#4ade80', label: 'Recent' },
  moderate: { bg: 'rgba(234, 179, 8, 0.1)', text: '#facc15', label: 'Moderate' },
  unused: { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', label: 'Unused' }
}

function Programs() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [selected, setSelected] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [programToDelete, setProgramToDelete] = useState(null)
  const [uninstallStatus, setUninstallStatus] = useState('confirm') // 'confirm', 'progress', 'complete', 'error'
  const [uninstallProgress, setUninstallProgress] = useState(0)
  const [sizeFilter, setSizeFilter] = useState('all') // 'all', 'large', 'medium', 'small', 'unknown'
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, program: null })
  const [calculating, setCalculating] = useState(false)

  // Context menu handlers
  const handleRowRightClick = (e, program) => {
    e.preventDefault()
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      program
    })
  }

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, program: null })
  }

  const openFileLocation = async () => {
    if (contextMenu.program?.installLocation) {
      await window.electronAPI.openFileLocation(contextMenu.program.installLocation)
    }
    closeContextMenu()
  }

  // Load installed programs from Windows registry
  const loadPrograms = async (recalculateSizes = false) => {
    setLoading(true)
    setError(null)
    try {
      // Clear cache if recalculating
      if (recalculateSizes) {
        await window.electronAPI.clearSizeCache()
      }

      const result = await window.electronAPI.getInstalledPrograms()
      if (result.success) {
        setPrograms(result.programs)
        setLoading(false)

        // Check if any programs need size calculation
        const needsSizing = result.programs.some(p => p.sizeBytes === 0 && p.installLocation)
        if (needsSizing || recalculateSizes) {
          setCalculating(true)
          const sizeResult = await window.electronAPI.calculateSizes(result.programs)
          if (sizeResult.success) {
            setPrograms(sizeResult.programs)
          }
          setCalculating(false)
        }
      } else {
        setError(result.error || 'Failed to load programs')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Failed to load programs')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrograms()
  }, [])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Helper to format size nicely
  const formatSize = (sizeBytes) => {
    if (!sizeBytes || sizeBytes === 0) return '—'
    const gb = sizeBytes / (1024 * 1024 * 1024)
    const mb = sizeBytes / (1024 * 1024)
    const kb = sizeBytes / 1024
    if (gb >= 1) return `${gb.toFixed(2)} GB`
    if (mb >= 1) return `${mb.toFixed(1)} MB`
    if (kb >= 1) return `${kb.toFixed(0)} KB`
    return `${sizeBytes} B`
  }

  const filteredPrograms = programs
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => {
      const bytes = p.sizeBytes || 0
      const mb = bytes / (1024 * 1024)
      const gb = bytes / (1024 * 1024 * 1024)
      switch (sizeFilter) {
        case 'large': return gb >= 1 // 1GB+
        case 'medium': return mb >= 100 && gb < 1 // 100MB - 1GB
        case 'small': return mb > 0 && mb < 100 // < 100MB
        case 'unknown': return bytes === 0
        default: return true
      }
    })
    .sort((a, b) => {
      let aVal, bVal
      // Use appropriate sort fields
      if (sortField === 'size') {
        aVal = a.sizeBytes || 0
        bVal = b.sizeBytes || 0
      } else if (sortField === 'installDate') {
        aVal = a.installDateSort || '1970-01-01'
        bVal = b.installDateSort || '1970-01-01'
      } else {
        aVal = a[sortField]
        bVal = b[sortField]
      }
      const modifier = sortDirection === 'asc' ? 1 : -1
      if (typeof aVal === 'string') return aVal.localeCompare(bVal) * modifier
      return (aVal - bVal) * modifier
    })

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selected.length === filteredPrograms.length) {
      setSelected([])
    } else {
      setSelected(filteredPrograms.map((p) => p.id))
    }
  }

  const handleUninstall = (program) => {
    setProgramToDelete(program)
    setUninstallStatus('confirm')
    setUninstallProgress(0)
    setShowModal(true)
  }

  const confirmUninstall = async () => {
    setUninstallStatus('progress')
    setUninstallProgress(10)

    try {
      // Handle batch uninstall
      if (Array.isArray(programToDelete?.ids)) {
        const programsToUninstall = programs.filter(p => programToDelete.ids.includes(p.id))
        let completed = 0

        for (const program of programsToUninstall) {
          if (!program.uninstallString) continue

          setUninstallProgress(10 + (completed / programsToUninstall.length) * 80)

          const result = await window.electronAPI.uninstallProgram(program.uninstallString)
          if (!result.success) {
            console.error(`Failed to uninstall ${program.name}:`, result.error)
          }
          completed++
        }

        setUninstallProgress(100)
        setUninstallStatus('complete')

        // Refresh the program list after uninstall
        setTimeout(() => {
          loadPrograms()
          setSelected([])
        }, 1500)
      } else {
        // Single program uninstall
        if (!programToDelete?.uninstallString) {
          setUninstallStatus('error')
          return
        }

        setUninstallProgress(30)

        const result = await window.electronAPI.uninstallProgram(programToDelete.uninstallString)

        if (result.success) {
          setUninstallProgress(100)
          setUninstallStatus('complete')

          // Refresh the program list after uninstall
          setTimeout(() => {
            loadPrograms()
            setSelected(prev => prev.filter(id => id !== programToDelete.id))
          }, 1500)
        } else {
          setUninstallStatus('error')
        }
      }
    } catch (err) {
      console.error('Uninstall error:', err)
      setUninstallStatus('error')
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setProgramToDelete(null)
    setUninstallStatus('confirm')
    setUninstallProgress(0)
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
  }

  const thStyle = {
    padding: '16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 500,
    color: '#a0a0b0',
    cursor: 'pointer',
    userSelect: 'none'
  }

  const tdStyle = {
    padding: '16px',
    borderTop: '1px solid #2a2a3a'
  }

  const renderModalContent = () => {
    switch (uninstallStatus) {
      case 'progress':
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Loader size={24} style={{ color: '#a855f7', animation: 'spin 1s linear infinite' }} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Uninstalling...
              </h3>
            </div>
            <p style={{ color: '#a0a0b0', margin: '0 0 20px 0' }}>
              Removing <strong style={{ color: '#f5f5f5' }}>{programToDelete?.name}</strong>
            </p>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#a0a0b0' }}>Progress</span>
                <span style={{ fontSize: '13px' }}>{Math.round(uninstallProgress)}%</span>
              </div>
              <div style={{
                height: '8px',
                backgroundColor: '#252532',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${uninstallProgress}%`,
                  backgroundColor: '#a855f7',
                  borderRadius: '4px',
                  transition: 'width 0.2s ease'
                }} />
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
              Please wait while the program is being uninstalled...
            </p>
          </>
        )

      case 'complete':
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <CheckCircle size={24} style={{ color: '#10b981' }} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Uninstall Complete
              </h3>
            </div>
            <p style={{ color: '#a0a0b0', margin: '0 0 24px 0' }}>
              <strong style={{ color: '#f5f5f5' }}>{programToDelete?.name}</strong> has been successfully removed from your system.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Done
              </button>
            </div>
          </>
        )

      case 'error':
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <AlertCircle size={24} style={{ color: '#ef4444' }} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Uninstall Failed
              </h3>
            </div>
            <p style={{ color: '#a0a0b0', margin: '0 0 24px 0' }}>
              Failed to uninstall <strong style={{ color: '#f5f5f5' }}>{programToDelete?.name}</strong>.
              The program may require administrator privileges or is currently in use.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #2a2a3a',
                  backgroundColor: 'transparent',
                  color: '#f5f5f5',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
              <button
                onClick={confirmUninstall}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Retry
              </button>
            </div>
          </>
        )

      default: // 'confirm'
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Confirm Uninstall
              </h3>
              <button
                onClick={closeModal}
                style={{
                  padding: '4px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#a0a0b0',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: '#252532',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>{programToDelete?.name}</p>
              {!Array.isArray(programToDelete?.id) && (
                <p style={{ margin: 0, fontSize: '13px', color: '#a0a0b0' }}>
                  Size: {programToDelete?.size} GB
                </p>
              )}
            </div>
            <p style={{ color: '#a0a0b0', margin: '0 0 24px 0', lineHeight: 1.6 }}>
              Are you sure you want to uninstall this program? This action will remove all associated files and cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #2a2a3a',
                  backgroundColor: 'transparent',
                  color: '#f5f5f5',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmUninstall}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Uninstall
              </button>
            </div>
          </>
        )
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Add keyframes for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1a1a24',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              padding: '10px 14px',
              width: '320px'
            }}
          >
            <Search size={16} style={{ color: '#a0a0b0' }} />
            <input
              type="text"
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#1a1a24',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              color: '#f5f5f5',
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">All Sizes</option>
            <option value="large">Large (1GB+)</option>
            <option value="medium">Medium (100MB-1GB)</option>
            <option value="small">Small (&lt;100MB)</option>
            <option value="unknown">Unknown Size</option>
          </select>
          <button
            onClick={() => loadPrograms(false)}
            disabled={loading || calculating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#1a1a24',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              cursor: (loading || calculating) ? 'not-allowed' : 'pointer',
              color: '#a0a0b0',
              fontSize: '14px'
            }}
          >
            <RefreshCw size={16} style={{ animation: (loading || calculating) ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Scanning...' : calculating ? 'Calculating sizes...' : 'Refresh'}
          </button>
          <button
            onClick={() => loadPrograms(true)}
            disabled={loading || calculating}
            title="Recalculate all program sizes (clears cache)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#1a1a24',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              cursor: (loading || calculating) ? 'not-allowed' : 'pointer',
              color: '#a0a0b0',
              fontSize: '13px'
            }}
          >
            Recalc Sizes
          </button>
          <span style={{ color: '#a0a0b0', fontSize: '13px' }}>
            {programs.length} programs {calculating && '(sizing...)'}
          </span>
        </div>

        {selected.length > 0 && (
          <button
            onClick={() => {
              setProgramToDelete({ ids: selected, name: `${selected.length} programs` })
              setUninstallStatus('confirm')
              setShowModal(true)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <Trash2 size={16} />
            Uninstall Selected ({selected.length})
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#f87171',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          backgroundColor: '#1a1a24',
          border: '1px solid #2a2a3a',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        {loading && programs.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Loader size={32} style={{ color: '#a855f7', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
            <p style={{ color: '#a0a0b0', margin: 0 }}>Scanning Windows registry for installed programs...</p>
          </div>
        ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#151520' }}>
              <th style={{ ...thStyle, width: '40px', cursor: 'default' }}>
                <input
                  type="checkbox"
                  checked={selected.length === filteredPrograms.length && filteredPrograms.length > 0}
                  onChange={toggleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={thStyle} onClick={() => handleSort('name')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Name <SortIcon field="name" />
                </div>
              </th>
              <th style={thStyle} onClick={() => handleSort('publisher')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Publisher <SortIcon field="publisher" />
                </div>
              </th>
              <th style={thStyle} onClick={() => handleSort('size')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Size <SortIcon field="size" />
                </div>
              </th>
              <th style={thStyle} onClick={() => handleSort('installDate')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Install Date <SortIcon field="installDate" />
                </div>
              </th>
              <th style={{ ...thStyle, cursor: 'default' }}>Status</th>
              <th style={{ ...thStyle, cursor: 'default' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPrograms.map((program) => {
              const status = statusColors[program.status]
              const maxSize = Math.max(...programs.map((p) => p.sizeBytes || 0), 1)
              const sizePercent = ((program.sizeBytes || 0) / maxSize) * 100

              return (
                <tr
                  key={program.id}
                  style={{ transition: 'background-color 0.15s', cursor: 'context-menu' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#252532'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onContextMenu={(e) => handleRowRightClick(e, program)}
                >
                  <td style={tdStyle}>
                    <input
                      type="checkbox"
                      checked={selected.includes(program.id)}
                      onChange={() => toggleSelect(program.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{program.name}</td>
                  <td style={{ ...tdStyle, color: '#a0a0b0' }}>{program.publisher}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '100px',
                          height: '6px',
                          backgroundColor: '#252532',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${sizePercent}%`,
                            height: '100%',
                            backgroundColor: '#a855f7',
                            borderRadius: '3px'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '13px', minWidth: '70px' }}>{formatSize(program.sizeBytes)}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: '#a0a0b0' }}>{program.installDate}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: status.bg,
                        color: status.text
                      }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleUninstall(program)}
                      style={{
                        padding: '8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#a0a0b0',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                        e.currentTarget.style.color = '#f87171'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#a0a0b0'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a24',
              border: '1px solid #2a2a3a',
              borderRadius: '12px',
              padding: '24px',
              width: '420px'
            }}
          >
            {renderModalContent()}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.show && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40
            }}
            onClick={closeContextMenu}
          />
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              backgroundColor: '#1a1a24',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              padding: '4px',
              zIndex: 50,
              minWidth: '180px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ padding: '8px 12px', fontSize: '12px', color: '#a0a0b0', borderBottom: '1px solid #2a2a3a', marginBottom: '4px' }}>
              {contextMenu.program?.name}
            </div>
            <button
              onClick={openFileLocation}
              disabled={!contextMenu.program?.installLocation}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                color: contextMenu.program?.installLocation ? '#f5f5f5' : '#6b7280',
                fontSize: '13px',
                cursor: contextMenu.program?.installLocation ? 'pointer' : 'not-allowed',
                textAlign: 'left',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (contextMenu.program?.installLocation) {
                  e.currentTarget.style.backgroundColor = '#252532'
                }
              }}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FolderOpen size={14} />
              Open File Location
            </button>
            <button
              onClick={() => {
                handleUninstall(contextMenu.program)
                closeContextMenu()
              }}
              disabled={!contextMenu.program?.uninstallString}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                color: contextMenu.program?.uninstallString ? '#f87171' : '#6b7280',
                fontSize: '13px',
                cursor: contextMenu.program?.uninstallString ? 'pointer' : 'not-allowed',
                textAlign: 'left',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (contextMenu.program?.uninstallString) {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                }
              }}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Trash2 size={14} />
              Uninstall
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Programs
