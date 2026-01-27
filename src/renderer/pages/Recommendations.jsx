import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Loader, Search, AlertTriangle, X, ChevronUp, ChevronDown, Sparkles, ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import jsPDF from 'jspdf'

const cardStyle = {
  backgroundColor: '#1a1a24',
  border: '1px solid #2a2a3a',
  borderRadius: '12px',
  padding: '20px',
}

// Format bytes to human readable
function formatMemory(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const gb = bytes / (1024 * 1024 * 1024)
  const mb = bytes / (1024 * 1024)
  const kb = bytes / 1024
  if (gb >= 1) return `${gb.toFixed(2)} GB`
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  if (kb >= 1) return `${kb.toFixed(0)} KB`
  return `${bytes} B`
}

function ConfirmModal({ process, onConfirmSingle, onConfirmAll, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onCancel}
    >
      <div
        style={{
          ...cardStyle,
          maxWidth: '450px',
          width: '90%'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
          <h3 style={{ margin: 0, fontSize: '18px' }}>End Task</h3>
        </div>
        <p style={{ color: '#a0a0b0', marginBottom: '20px', lineHeight: 1.5 }}>
          Are you sure you want to end <strong style={{ color: '#f5f5f5' }}>{process.name}</strong>?
          <br /><br />
          Ending this process may cause unsaved data to be lost.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#f5f5f5',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#252532'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirmSingle}
            style={{
              padding: '10px 20px',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#f59e0b',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#f59e0b'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#f59e0b'
            }}
          >
            End This Process
          </button>
          <button
            onClick={onConfirmAll}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            End All "{process.name}"
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusMessage({ message, type, onClose }) {
  const bgColor = type === 'success' ? '#10b98120' : '#ef444420'
  const borderColor = type === 'success' ? '#10b981' : '#ef4444'
  const textColor = type === 'success' ? '#10b981' : '#ef4444'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        marginBottom: '16px'
      }}
    >
      <span style={{ color: textColor, fontSize: '14px' }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: textColor,
          cursor: 'pointer',
          padding: '4px'
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}

function Recommendations() {
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('cpu')
  const [sortOrder, setSortOrder] = useState('desc')
  const [confirmProcess, setConfirmProcess] = useState(null)
  const [statusMessage, setStatusMessage] = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)

  // AI Audit state
  const [hasEnvKey, setHasEnvKey] = useState(false)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditResult, setAuditResult] = useState(null)
  const [auditError, setAuditError] = useState(null)
  const [totalSpent, setTotalSpent] = useState(() => parseFloat(localStorage.getItem('anthropic_total_spent') || '0'))
  const [lastUsage, setLastUsage] = useState(null)
  const BUDGET_LIMIT = 5.00 // $5 budget

  // Check if API key is configured in .env
  useEffect(() => {
    window.electronAPI.hasEnvApiKey().then(result => {
      setHasEnvKey(result.hasKey)
    })
  }, [])

  const fetchProcesses = useCallback(async () => {
    try {
      const result = await window.electronAPI.getDetailedProcesses()
      if (result.success) {
        setProcesses(result.processes)
      }
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch processes:', err)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProcesses()
    const interval = setInterval(fetchProcesses, 3000)
    return () => clearInterval(interval)
  }, [fetchProcesses])

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handleEndTaskSingle = async () => {
    if (!confirmProcess) return

    try {
      const result = await window.electronAPI.terminateProcess(confirmProcess.pid)
      if (result.success) {
        setStatusMessage({ text: `Successfully ended ${confirmProcess.name} (PID: ${confirmProcess.pid})`, type: 'success' })
        fetchProcesses()
      } else {
        setStatusMessage({ text: `Failed to end ${confirmProcess.name}: ${result.error}`, type: 'error' })
      }
    } catch (err) {
      setStatusMessage({ text: `Error: ${err.message}`, type: 'error' })
    }
    setConfirmProcess(null)
    setTimeout(() => setStatusMessage(null), 5000)
  }

  const handleEndTaskAll = async () => {
    if (!confirmProcess) return

    try {
      const result = await window.electronAPI.terminateProcessByName(confirmProcess.name)
      if (result.success) {
        setStatusMessage({ text: `Successfully ended all "${confirmProcess.name}" processes`, type: 'success' })
        fetchProcesses()
      } else {
        setStatusMessage({ text: `Failed to end ${confirmProcess.name}: ${result.error}`, type: 'error' })
      }
    } catch (err) {
      setStatusMessage({ text: `Error: ${err.message}`, type: 'error' })
    }
    setConfirmProcess(null)
    setTimeout(() => setStatusMessage(null), 5000)
  }

  const generatePDF = () => {
    if (!auditResult) return

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    let yPos = margin

    // Clean text - remove emojis and convert to readable labels
    const cleanText = (text) => {
      return text
        // Remove all emoji characters (comprehensive regex)
        .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu, '')
        // Remove markdown ### headers
        .replace(/^###\s*/gm, '')
        // Remove ** bold markers
        .replace(/\*\*(.*?)\*\*/g, '$1')
        // Remove ` code markers
        .replace(/`([^`]+)`/g, '$1')
        // Clean up extra whitespace
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Helper function to add new page if needed
    const checkPageBreak = (height) => {
      if (yPos + height > pageHeight - 25) {
        pdf.addPage()
        yPos = margin
        return true
      }
      return false
    }

    // === HEADER ===
    pdf.setFillColor(30, 30, 40)
    pdf.rect(0, 0, pageWidth, 45, 'F')

    pdf.setTextColor(168, 85, 247)
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text('LEGACY SWEEPER', margin, 20)

    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'normal')
    pdf.text('System Process Security Audit Report', margin, 32)

    pdf.setFontSize(10)
    pdf.setTextColor(180, 180, 190)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 41)

    yPos = 55

    // === EXECUTIVE SUMMARY BOX ===
    pdf.setFillColor(245, 245, 250)
    pdf.roundedRect(margin, yPos, contentWidth, 28, 3, 3, 'F')
    pdf.setDrawColor(168, 85, 247)
    pdf.setLineWidth(0.5)
    pdf.roundedRect(margin, yPos, contentWidth, 28, 3, 3, 'S')

    pdf.setTextColor(168, 85, 247)
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text('EXECUTIVE SUMMARY', margin + 5, yPos + 8)

    pdf.setTextColor(50, 50, 60)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    const summaryText = `This automated security audit analyzed ${processes.length} running processes on your Windows system to identify potential security risks, performance issues, and unnecessary bloatware.`
    const summaryLines = pdf.splitTextToSize(summaryText, contentWidth - 10)
    pdf.text(summaryLines, margin + 5, yPos + 16)

    yPos += 38

    // === SYSTEM STATS ===
    const statBoxWidth = (contentWidth - 10) / 3

    // Box 1
    pdf.setFillColor(168, 85, 247)
    pdf.roundedRect(margin, yPos, statBoxWidth, 22, 2, 2, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(8)
    pdf.text('TOTAL PROCESSES', margin + 5, yPos + 7)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text(processes.length.toString(), margin + 5, yPos + 18)

    // Box 2
    pdf.setFillColor(240, 240, 245)
    pdf.roundedRect(margin + statBoxWidth + 5, yPos, statBoxWidth, 22, 2, 2, 'F')
    pdf.setTextColor(100, 100, 110)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.text('ANALYSIS DATE', margin + statBoxWidth + 10, yPos + 7)
    pdf.setTextColor(50, 50, 60)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(new Date().toLocaleDateString(), margin + statBoxWidth + 10, yPos + 17)

    // Box 3
    pdf.setFillColor(240, 240, 245)
    pdf.roundedRect(margin + (statBoxWidth + 5) * 2, yPos, statBoxWidth, 22, 2, 2, 'F')
    pdf.setTextColor(100, 100, 110)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.text('AUDIT VERSION', margin + (statBoxWidth + 5) * 2 + 5, yPos + 7)
    pdf.setTextColor(50, 50, 60)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('1.0', margin + (statBoxWidth + 5) * 2 + 5, yPos + 17)

    yPos += 32

    // === MAIN CONTENT ===
    const sections = auditResult.split(/^## /m).filter(s => s.trim())

    sections.forEach((section) => {
      const lines = section.split('\n')
      let title = cleanText(lines[0])
      const content = lines.slice(1).join('\n').trim()

      // Skip if title is just a # header marker
      if (title.startsWith('#')) {
        title = title.replace(/^#+\s*/, '')
      }

      checkPageBreak(25)

      // Section header with colored bar
      pdf.setFillColor(168, 85, 247)
      pdf.rect(margin, yPos, 4, 8, 'F')

      pdf.setTextColor(50, 50, 60)
      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.text(title.toUpperCase(), margin + 8, yPos + 6)

      // Underline
      pdf.setDrawColor(220, 220, 230)
      pdf.setLineWidth(0.3)
      pdf.line(margin, yPos + 10, pageWidth - margin, yPos + 10)

      yPos += 16

      // Process content
      const contentLines = content.split('\n')
      contentLines.forEach(line => {
        let text = line.trim()
        if (!text) {
          yPos += 2
          return
        }

        // Clean the text
        text = cleanText(text)
        if (!text) return

        checkPageBreak(7)

        let xOffset = margin
        let isBullet = false
        let isNumbered = false
        let bulletNum = ''

        // Check for sub-headers (lines that end with :)
        if (text.endsWith(':') && text.length < 60 && !text.includes(' - ')) {
          checkPageBreak(10)
          pdf.setTextColor(80, 80, 100)
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'bold')
          const wrappedHeader = pdf.splitTextToSize(text, contentWidth)
          pdf.text(wrappedHeader, margin, yPos)
          yPos += wrappedHeader.length * 5 + 3
          return
        }

        // Handle bullet points
        if (text.startsWith('- ') || text.startsWith('* ')) {
          isBullet = true
          text = text.substring(2)
          xOffset = margin + 6
        }

        // Handle numbered lists
        const numMatch = text.match(/^(\d+)\.\s+(.*)/)
        if (numMatch) {
          isNumbered = true
          bulletNum = numMatch[1]
          text = numMatch[2]
          xOffset = margin + 8
        }

        // Set text style
        pdf.setTextColor(60, 60, 70)
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')

        // Draw bullet or number
        if (isBullet) {
          pdf.setFillColor(168, 85, 247)
          pdf.circle(margin + 2, yPos - 1.2, 1.2, 'F')
        }
        if (isNumbered) {
          pdf.setTextColor(168, 85, 247)
          pdf.setFont('helvetica', 'bold')
          pdf.text(bulletNum + '.', margin, yPos)
          pdf.setTextColor(60, 60, 70)
          pdf.setFont('helvetica', 'normal')
        }

        // Word wrap and render
        const wrappedLines = pdf.splitTextToSize(text, contentWidth - (xOffset - margin) - 2)
        wrappedLines.forEach((wLine, wIdx) => {
          checkPageBreak(5)
          pdf.text(wLine, wIdx === 0 ? xOffset : margin + 6, yPos)
          yPos += 4.5
        })

        yPos += 1
      })

      yPos += 8
    })

    // === FOOTER ON EACH PAGE ===
    const totalPages = pdf.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)

      // Footer line
      pdf.setDrawColor(200, 200, 210)
      pdf.setLineWidth(0.3)
      pdf.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18)

      // Footer text
      pdf.setTextColor(120, 120, 130)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.text('This report was generated by Legacy Sweeper using AI-powered analysis.', margin, pageHeight - 12)
      pdf.text('Always create a system restore point before making changes.', margin, pageHeight - 8)

      // Page number
      pdf.setTextColor(168, 85, 247)
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 10)
    }

    // Save the PDF
    const fileName = `LegacySweeper_Audit_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)
  }

  const handleRunAudit = async () => {
    if (!hasEnvKey) {
      setAuditError('No API key found. Add ANTHROPIC_API_KEY to .env file and restart the app.')
      return
    }

    if (totalSpent >= BUDGET_LIMIT) {
      setAuditError('Budget limit reached! You have spent $' + totalSpent.toFixed(4) + ' of your $' + BUDGET_LIMIT.toFixed(2) + ' budget.')
      return
    }

    setAuditLoading(true)
    setAuditError(null)
    setAuditResult(null)

    try {
      const result = await window.electronAPI.runProcessAudit(null) // Uses .env key
      if (result.success) {
        setAuditResult(result.audit)
        if (result.usage) {
          setLastUsage(result.usage)
          const newTotal = totalSpent + result.usage.cost
          setTotalSpent(newTotal)
          localStorage.setItem('anthropic_total_spent', newTotal.toString())
        }
      } else {
        setAuditError(result.error)
      }
    } catch (err) {
      setAuditError(err.message)
    }
    setAuditLoading(false)
  }

  // Filter and sort processes
  const filteredProcesses = processes
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1
      if (sortBy === 'name') {
        return multiplier * a.name.localeCompare(b.name)
      }
      if (sortBy === 'memory') {
        return multiplier * (a.memoryBytes - b.memoryBytes)
      }
      return multiplier * (a[sortBy] - b[sortBy])
    })

  // Pagination calculations
  const totalPages = Math.ceil(filteredProcesses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProcesses = filteredProcesses.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Determine row color based on resource usage
  const getRowStyle = (process) => {
    const memoryMB = process.memoryBytes / (1024 * 1024)
    const isHighCpu = process.cpu > 20
    const isHighMemory = memoryMB > 1000

    if (isHighCpu || isHighMemory) {
      return { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444' }
    }
    if (process.cpu > 5 || memoryMB > 500) {
      return { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b' }
    }
    return { backgroundColor: '#252532', borderLeft: '3px solid transparent' }
  }

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
  }

  const headerStyle = (column) => ({
    padding: '12px 16px',
    textAlign: column === 'name' ? 'left' : 'right',
    color: sortBy === column ? '#a855f7' : '#a0a0b0',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    userSelect: 'none',
    borderBottom: '1px solid #2a2a3a',
    whiteSpace: 'nowrap'
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {statusMessage && (
        <StatusMessage
          message={statusMessage.text}
          type={statusMessage.type}
          onClose={() => setStatusMessage(null)}
        />
      )}

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>
            Resource-Heavy Processes
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#a0a0b0'
                }}
              />
              <input
                type="text"
                placeholder="Search processes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 12px 8px 36px',
                  backgroundColor: '#252532',
                  border: '1px solid #2a2a3a',
                  borderRadius: '8px',
                  color: '#f5f5f5',
                  fontSize: '14px',
                  width: '200px',
                  outline: 'none'
                }}
              />
            </div>
            {loading && (
              <Loader size={18} style={{ color: '#a855f7', animation: 'spin 1s linear infinite' }} />
            )}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '2px' }} />
            <span style={{ color: '#a0a0b0' }}>High usage (CPU &gt;20% or Memory &gt;1 GB)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '2px' }} />
            <span style={{ color: '#a0a0b0' }}>Moderate usage (CPU &gt;5% or Memory &gt;500 MB)</span>
          </div>
        </div>

        {/* Process table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerStyle('name')} onClick={() => handleSort('name')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Name <SortIcon column="name" />
                  </div>
                </th>
                <th style={headerStyle('pid')} onClick={() => handleSort('pid')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    PID <SortIcon column="pid" />
                  </div>
                </th>
                <th style={headerStyle('cpu')} onClick={() => handleSort('cpu')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    CPU % <SortIcon column="cpu" />
                  </div>
                </th>
                <th style={headerStyle('memory')} onClick={() => handleSort('memory')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    Memory <SortIcon column="memory" />
                  </div>
                </th>
                <th style={{ ...headerStyle('action'), cursor: 'default' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProcesses.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#a0a0b0' }}>
                    {loading ? 'Loading processes...' : 'No processes found'}
                  </td>
                </tr>
              ) : (
                paginatedProcesses.map(process => (
                  <tr
                    key={process.pid}
                    style={{
                      ...getRowStyle(process),
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      const style = getRowStyle(process)
                      e.currentTarget.style.backgroundColor = style.borderLeft.includes('ef4444')
                        ? 'rgba(239, 68, 68, 0.2)'
                        : style.borderLeft.includes('f59e0b')
                          ? 'rgba(245, 158, 11, 0.2)'
                          : '#2a2a3a'
                    }}
                    onMouseLeave={e => {
                      const style = getRowStyle(process)
                      e.currentTarget.style.backgroundColor = style.backgroundColor
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{process.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#a0a0b0' }}>
                      {process.pid}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: process.cpu > 20 ? '#ef4444' : process.cpu > 5 ? '#f59e0b' : '#10b981' }}>
                      {process.cpu.toFixed(1)}%
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: process.memoryBytes > 1024*1024*1024 ? '#ef4444' : process.memoryBytes > 500*1024*1024 ? '#f59e0b' : '#10b981' }}>
                      {formatMemory(process.memoryBytes)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setConfirmProcess(process)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #a855f7',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          color: '#a855f7',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 500,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = '#a855f7'
                          e.currentTarget.style.color = '#fff'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = '#a855f7'
                        }}
                      >
                        End Task
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ fontSize: '12px', color: '#a0a0b0' }}>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredProcesses.length)} of {filteredProcesses.length} processes
            {filteredProcesses.length !== processes.length && ` (filtered from ${processes.length})`}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Items per page selector */}
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              style={{
                padding: '6px 8px',
                backgroundColor: '#252532',
                border: '1px solid #2a2a3a',
                borderRadius: '6px',
                color: '#f5f5f5',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>

            {/* Page navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #2a2a3a',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: currentPage === 1 ? '#4a4a5a' : '#a0a0b0',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px',
                  border: '1px solid #2a2a3a',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: currentPage === 1 ? '#4a4a5a' : '#a0a0b0',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <span style={{ padding: '0 12px', fontSize: '13px', color: '#f5f5f5' }}>
                Page {currentPage} of {totalPages || 1}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                style={{
                  padding: '6px',
                  border: '1px solid #2a2a3a',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: currentPage >= totalPages ? '#4a4a5a' : '#a0a0b0',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #2a2a3a',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: currentPage >= totalPages ? '#4a4a5a' : '#a0a0b0',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                Last
              </button>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            Auto-refreshes every 3 seconds
          </div>
        </div>
      </div>

      {/* AI Audit Panel */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={20} style={{ color: '#a855f7' }} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>
              AI Process Audit
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              backgroundColor: hasEnvKey ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: hasEnvKey ? '#10b981' : '#ef4444',
              border: `1px solid ${hasEnvKey ? '#10b981' : '#ef4444'}`
            }}>
              {hasEnvKey ? 'API Key Configured' : 'No API Key'}
            </span>
            <button
              onClick={handleRunAudit}
              disabled={auditLoading}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: auditLoading ? '#4a4a5a' : '#a855f7',
                color: '#fff',
                cursor: auditLoading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => { if (!auditLoading) e.currentTarget.style.backgroundColor = '#9333ea' }}
              onMouseLeave={e => { if (!auditLoading) e.currentTarget.style.backgroundColor = '#a855f7' }}
            >
              {auditLoading ? (
                <>
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate Audit
                </>
              )}
            </button>
          </div>
        </div>

        {/* Usage Tracker */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '12px 16px',
          backgroundColor: '#252532',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#a0a0b0' }}>Budget Used</span>
              <span style={{ fontSize: '12px', color: totalSpent >= BUDGET_LIMIT ? '#ef4444' : '#10b981' }}>
                ${totalSpent.toFixed(4)} / ${BUDGET_LIMIT.toFixed(2)}
              </span>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: '#1a1a24',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min((totalSpent / BUDGET_LIMIT) * 100, 100)}%`,
                backgroundColor: totalSpent >= BUDGET_LIMIT * 0.9 ? '#ef4444' : totalSpent >= BUDGET_LIMIT * 0.7 ? '#f59e0b' : '#a855f7',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          {lastUsage && (
            <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>
              Last: {lastUsage.inputTokens + lastUsage.outputTokens} tokens
              <br />(${lastUsage.cost.toFixed(4)})
            </div>
          )}
          <button
            onClick={() => {
              if (confirm('Reset usage tracker to $0?')) {
                setTotalSpent(0)
                setLastUsage(null)
                localStorage.setItem('anthropic_total_spent', '0')
              }
            }}
            style={{
              padding: '4px 8px',
              border: '1px solid #2a2a3a',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Reset
          </button>
        </div>

        {/* Audit Error */}
        {auditError && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '16px',
            color: '#ef4444',
            fontSize: '14px'
          }}>
            Error: {auditError}
          </div>
        )}

        {/* Audit Result */}
        {auditResult ? (
          <div>
            {/* Export Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button
                onClick={generatePDF}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10b981'}
              >
                <FileDown size={16} />
                Export PDF Report
              </button>
            </div>
            <div style={{
              padding: '20px',
              backgroundColor: '#252532',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: 1.7,
              color: '#e5e5e5'
            }}>
            <style>{`
              .audit-result h1, .audit-result h2, .audit-result h3 {
                color: #a855f7;
                margin-top: 16px;
                margin-bottom: 8px;
              }
              .audit-result h1 { font-size: 18px; }
              .audit-result h2 { font-size: 16px; }
              .audit-result h3 { font-size: 14px; }
              .audit-result ul, .audit-result ol {
                margin: 8px 0;
                padding-left: 24px;
              }
              .audit-result li {
                margin: 4px 0;
              }
              .audit-result strong {
                color: #f5f5f5;
              }
              .audit-result code {
                background-color: #1a1a24;
                padding: 2px 6px;
                border-radius: 4px;
                font-family: monospace;
                color: #10b981;
              }
              .audit-result p {
                margin: 8px 0;
              }
            `}</style>
            <div
              className="audit-result"
              dangerouslySetInnerHTML={{
                __html: auditResult
                  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                  .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/`(.*?)`/g, '<code>$1</code>')
                  .replace(/^\- (.*$)/gm, '<li>$1</li>')
                  .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
                  .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/\n/g, '<br>')
              }}
            />
            </div>
          </div>
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            {auditLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Loader size={32} style={{ color: '#a855f7', animation: 'spin 1s linear infinite' }} />
                <span>Analyzing your processes with AI...</span>
                <span style={{ fontSize: '12px' }}>This may take 10-20 seconds</span>
              </div>
            ) : (
              <>
                Click "Generate Audit" to analyze your running processes with AI.
                <br />
                Get recommendations on what to stop, potential security risks, and optimization tips.
              </>
            )}
          </div>
        )}
      </div>

      {confirmProcess && (
        <ConfirmModal
          process={confirmProcess}
          onConfirmSingle={handleEndTaskSingle}
          onConfirmAll={handleEndTaskAll}
          onCancel={() => setConfirmProcess(null)}
        />
      )}
    </div>
  )
}

export default Recommendations
