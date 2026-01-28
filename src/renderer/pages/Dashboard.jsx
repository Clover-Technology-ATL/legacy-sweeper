import React, { useState, useEffect } from 'react'
import { Package, HardDrive, TrendingUp, AlertTriangle, Loader } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

// Different colors for each bar
const barColors = [
  '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899'
]

// Category colors - distinct colors for each category
const categoryColors = {
  'Gaming': '#10b981',       // Green
  'Development': '#a855f7',  // Purple
  'Creative': '#f59e0b',     // Amber
  'Browsers': '#3b82f6',     // Blue
  'Communication': '#ec4899', // Pink
  'Media': '#f97316',        // Orange
  'Security': '#ef4444',     // Red
  'Productivity': '#14b8a6', // Teal
  'System': '#6366f1',       // Indigo
  'Drivers': '#8b5cf6',      // Violet
  'Other': '#6b7280'         // Gray
}

// Auto-categorize based on publisher/name
function categorizeProgram(program) {
  const name = (program.name || '').toLowerCase()
  const publisher = (program.publisher || '').toLowerCase()

  // Gaming - check first as many games have generic publishers
  if (
    name.includes('game') || name.includes('steam') || name.includes('epic games') ||
    name.includes('origin') || name.includes('battle.net') || name.includes('gog') ||
    name.includes('ubisoft') || name.includes('rockstar') || name.includes('riot') ||
    name.includes('valorant') || name.includes('league of legends') || name.includes('minecraft') ||
    name.includes('fortnite') || name.includes('overwatch') || name.includes('apex') ||
    name.includes('warzone') || name.includes('call of duty') || name.includes('gta') ||
    name.includes('cyberpunk') || name.includes('witcher') || name.includes('elden ring') ||
    name.includes('hogwarts') || name.includes('diablo') || name.includes('world of warcraft') ||
    name.includes('arma') || name.includes('dayz') || name.includes('ready or not') ||
    name.includes('tarkov') || name.includes('pubg') || name.includes('rust') ||
    name.includes('destiny') || name.includes('halo') || name.includes('doom') ||
    name.includes('battlefield') || name.includes('fifa') || name.includes('madden') ||
    name.includes('nba 2k') || name.includes('assassin') || name.includes('far cry') ||
    name.includes('rainbow six') || name.includes('counter-strike') || name.includes('csgo') ||
    name.includes('cs2') || name.includes('dota') || name.includes('path of exile') ||
    name.includes('warframe') || name.includes('payday') || name.includes('left 4 dead') ||
    name.includes('dead by daylight') || name.includes('phasmophobia') || name.includes('lethal company') ||
    name.includes('roblox') || name.includes('launcher') && (name.includes('riot') || name.includes('epic') || name.includes('rockstar') || name.includes('ea app')) ||
    publisher.includes('valve') || publisher.includes('electronic arts') || publisher.includes('ea ') ||
    publisher.includes('ubisoft') || publisher.includes('activision') || publisher.includes('blizzard') ||
    publisher.includes('riot games') || publisher.includes('rockstar') || publisher.includes('2k') ||
    publisher.includes('bethesda') || publisher.includes('cd projekt') || publisher.includes('square enix') ||
    publisher.includes('capcom') || publisher.includes('sega') || publisher.includes('bandai namco') ||
    publisher.includes('bohemia') || publisher.includes('void interactive') || publisher.includes('grinding gear') ||
    publisher.includes('digital extremes') || publisher.includes('respawn') || publisher.includes('bungie') ||
    publisher.includes('id software') || publisher.includes('remedy') || publisher.includes('fromsoftware')
  ) {
    return 'Gaming'
  }

  // Browsers
  if (
    name.includes('chrome') || name.includes('firefox') || name.includes('edge') ||
    name.includes('opera') || name.includes('brave') || name.includes('vivaldi') ||
    name.includes('safari') || name.includes('browser')
  ) {
    return 'Browsers'
  }

  // Security - antivirus, VPN, firewalls
  if (
    name.includes('antivirus') || name.includes('malware') || name.includes('security') ||
    name.includes('norton') || name.includes('mcafee') || name.includes('kaspersky') ||
    name.includes('avast') || name.includes('avg') || name.includes('bitdefender') ||
    name.includes('defender') || name.includes('firewall') || name.includes('vpn') ||
    name.includes('nordvpn') || name.includes('expressvpn') || name.includes('proton') ||
    publisher.includes('norton') || publisher.includes('mcafee') || publisher.includes('avast')
  ) {
    return 'Security'
  }

  // Communication - chat, video calls, email
  if (
    name.includes('discord') || name.includes('slack') || name.includes('zoom') ||
    name.includes('teams') || name.includes('skype') || name.includes('telegram') ||
    name.includes('whatsapp') || name.includes('signal') || name.includes('webex') ||
    name.includes('outlook') || name.includes('thunderbird') || name.includes('mailbird')
  ) {
    return 'Communication'
  }

  // Creative - design, photo, video editing
  if (
    name.includes('photoshop') || name.includes('illustrator') || name.includes('premiere') ||
    name.includes('after effects') || name.includes('lightroom') || name.includes('indesign') ||
    name.includes('figma') || name.includes('sketch') || name.includes('canva') ||
    name.includes('gimp') || name.includes('inkscape') || name.includes('blender') ||
    name.includes('davinci') || name.includes('obs') || name.includes('audacity') ||
    name.includes('fl studio') || name.includes('ableton') || name.includes('logic pro') ||
    publisher.includes('adobe') || publisher.includes('autodesk') || publisher.includes('corel')
  ) {
    return 'Creative'
  }

  // Media - players, streaming
  if (
    name.includes('vlc') || name.includes('media player') || name.includes('spotify') ||
    name.includes('itunes') || name.includes('netflix') || name.includes('plex') ||
    name.includes('kodi') || name.includes('foobar') || name.includes('winamp') ||
    name.includes('musicbee') || name.includes('audible') || name.includes('podcast') ||
    name.includes('youtube') || name.includes('twitch')
  ) {
    return 'Media'
  }

  // Development - IDEs, SDKs, programming tools
  if (
    name.includes('visual studio') || name.includes('vs code') || name.includes('vscode') ||
    name.includes('intellij') || name.includes('pycharm') || name.includes('webstorm') ||
    name.includes('android studio') || name.includes('xcode') || name.includes('eclipse') ||
    name.includes('sublime') || name.includes('notepad++') || name.includes('atom') ||
    name.includes('git') || name.includes('node') || name.includes('python') ||
    name.includes('java ') || name.includes('jdk') || name.includes('jre') ||
    name.includes('sdk') || name.includes('docker') || name.includes('postman') ||
    name.includes('insomnia') || name.includes('mongodb') || name.includes('mysql') ||
    name.includes('postgresql') || name.includes('redis') || name.includes('cmake') ||
    name.includes('rust') || name.includes('go ') || name.includes('golang') ||
    name.includes('.net') || name.includes('dotnet') || name.includes('nuget') ||
    name.includes('npm') || name.includes('yarn') || name.includes('composer') ||
    publisher.includes('jetbrains') || publisher.includes('github') || publisher.includes('gitlab')
  ) {
    return 'Development'
  }

  // Productivity - office, notes, utilities
  if (
    name.includes('office') || name.includes('word') || name.includes('excel') ||
    name.includes('powerpoint') || name.includes('onenote') || name.includes('notion') ||
    name.includes('evernote') || name.includes('obsidian') || name.includes('todoist') ||
    name.includes('trello') || name.includes('asana') || name.includes('pdf') ||
    name.includes('acrobat') || name.includes('foxit') || name.includes('libreoffice') ||
    name.includes('openoffice') || name.includes('google docs') || name.includes('dropbox') ||
    name.includes('onedrive') || name.includes('google drive') || name.includes('box') ||
    name.includes('1password') || name.includes('lastpass') || name.includes('bitwarden')
  ) {
    return 'Productivity'
  }

  // Peripherals/RGB Software - gaming peripherals software (before Drivers)
  if (
    name.includes('signalrgb') || name.includes('icue') || name.includes('synapse') ||
    name.includes('g hub') || name.includes('ghub') || name.includes('armory crate') ||
    name.includes('steelseries gg') || name.includes('openrgb') || name.includes('rgb') ||
    name.includes('logitech') || name.includes('razer') || name.includes('corsair') ||
    name.includes('steelseries') || name.includes('hyperx') || name.includes('elgato')
  ) {
    return 'Gaming'  // Group with Gaming since it's gaming peripherals
  }

  // Drivers - actual hardware drivers only
  if (
    name.includes('driver') ||
    (name.includes('nvidia') && (name.includes('driver') || name.includes('geforce') || name.includes('control panel'))) ||
    (name.includes('amd') && (name.includes('driver') || name.includes('radeon') || name.includes('software'))) ||
    name.includes('realtek') || name.includes('chipset') ||
    (name.includes('intel') && (name.includes('driver') || name.includes('chipset') || name.includes('graphics')))
  ) {
    return 'Drivers'
  }

  // System - Windows components, runtimes, system tools
  if (
    name.includes('microsoft') || name.includes('windows') || name.includes('runtime') ||
    name.includes('redistributable') || name.includes('vcredist') || name.includes('directx') ||
    name.includes('update') || name.includes('hotfix') || name.includes('service pack') ||
    name.includes('framework') || name.includes('.net framework') ||
    publisher.includes('microsoft')
  ) {
    return 'System'
  }

  return 'Other'
}

const cardStyle = {
  backgroundColor: '#1a1a24',
  border: '1px solid #2a2a3a',
  borderRadius: '12px',
  padding: '20px',
  transition: 'border-color 0.2s ease'
}

function StatCard({ label, value, icon: Icon, change, loading }) {
  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2a2a3a'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#a0a0b0', fontSize: '14px', margin: 0 }}>{label}</p>
          <p style={{ fontSize: '28px', fontWeight: 600, margin: '8px 0' }}>
            {loading ? <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} /> : value}
          </p>
          <p style={{ color: '#a0a0b0', fontSize: '12px', margin: 0 }}>{change}</p>
        </div>
        <div
          style={{
            padding: '10px',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderRadius: '8px'
          }}
        >
          <Icon size={22} style={{ color: '#a855f7' }} />
        </div>
      </div>
    </div>
  )
}

// Custom bar shape to apply individual colors
const CustomBar = (props) => {
  const { x, y, width, height, index } = props
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={barColors[index % barColors.length]}
      rx={4}
      ry={4}
    />
  )
}

// Format bytes to readable size
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0'
  const gb = bytes / (1024 * 1024 * 1024)
  const mb = bytes / (1024 * 1024)
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  if (mb >= 1) return `${mb.toFixed(0)} MB`
  return '< 1 MB'
}

function Dashboard() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, program: null })
  const [calculating, setCalculating] = useState(false)
  const [categoryModal, setCategoryModal] = useState({ show: false, category: null, programs: [] })

  useEffect(() => {
    async function loadPrograms() {
      try {
        // First load - fast, uses cached sizes
        const result = await window.electronAPI.getInstalledPrograms()
        if (result.success) {
          setPrograms(result.programs)
          setLoading(false)

          // Check if any programs need size calculation
          const needsSizing = result.programs.some(p => p.sizeBytes === 0 && p.installLocation)
          if (needsSizing) {
            setCalculating(true)
            // Calculate sizes in background
            const sizeResult = await window.electronAPI.calculateSizes(result.programs)
            if (sizeResult.success) {
              setPrograms(sizeResult.programs)
            }
            setCalculating(false)
          }
        }
      } catch (err) {
        console.error('Failed to load programs:', err)
        setLoading(false)
      }
    }
    loadPrograms()
  }, [])

  // Calculate stats from real data
  const totalPrograms = programs.length
  const totalBytes = programs.reduce((sum, p) => sum + (p.sizeBytes || 0), 0)
  const totalSizeFormatted = formatSize(totalBytes)

  const programsWithSize = programs.filter(p => p.sizeBytes > 0)
  const largestProgram = programsWithSize.length > 0
    ? programsWithSize.reduce((max, p) => (p.sizeBytes || 0) > (max.sizeBytes || 0) ? p : max, programsWithSize[0])
    : null

  const unusedPrograms = programs.filter(p => p.status === 'unused')
  const unusedPercent = totalPrograms > 0 ? Math.round((unusedPrograms.length / totalPrograms) * 100) : 0

  // Top 10 largest programs
  const topPrograms = [...programsWithSize]
    .sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0))
    .slice(0, 10)
    .map(p => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      size: parseFloat((p.sizeBytes / (1024 * 1024 * 1024)).toFixed(2)),
      fullName: p.name,
      installLocation: p.installLocation,
      uninstallString: p.uninstallString
    }))

  // Handle category click
  const handleCategoryClick = (categoryName) => {
    const categoryPrograms = programs
      .filter(p => categorizeProgram(p) === categoryName)
      .sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0))
    setCategoryModal({ show: true, category: categoryName, programs: categoryPrograms })
  }

  // Handle right-click on bar
  const handleBarRightClick = (data, e) => {
    e.preventDefault()
    if (data && data.activePayload && data.activePayload[0]) {
      const program = data.activePayload[0].payload
      setContextMenu({
        show: true,
        x: e.clientX,
        y: e.clientY,
        program
      })
    }
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

  // Category breakdown
  const categoryTotals = {}
  programs.forEach(p => {
    const cat = categorizeProgram(p)
    if (!categoryTotals[cat]) categoryTotals[cat] = 0
    categoryTotals[cat] += (p.sizeBytes || 0)
  })

  const categoryData = Object.entries(categoryTotals)
    .map(([name, bytes]) => ({
      name,
      value: parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(2)),
      color: categoryColors[name] || '#6b7280'
    }))
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value)

  const stats = [
    {
      label: 'Total Programs',
      value: totalPrograms.toString(),
      icon: Package,
      change: `${programsWithSize.length} with known size`
    },
    {
      label: 'Total Size',
      value: totalSizeFormatted,
      icon: HardDrive,
      change: calculating ? 'Calculating sizes...' : `${programsWithSize.length} programs measured`
    },
    {
      label: 'Largest Program',
      value: largestProgram ? (largestProgram.name.length > 15 ? largestProgram.name.substring(0, 15) + '...' : largestProgram.name) : 'N/A',
      icon: TrendingUp,
      change: largestProgram ? formatSize(largestProgram.sizeBytes) : 'No size data'
    },
    {
      label: 'Old (1yr+)',
      value: unusedPrograms.length.toString(),
      icon: AlertTriangle,
      change: `${unusedPercent}% of total`
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} loading={loading} />
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Bar chart */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>
              Top 10 Largest Programs
            </h3>
            <span style={{ fontSize: '12px', color: '#a0a0b0', padding: '4px 10px', backgroundColor: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px' }}>
              Right-click for options
            </span>
          </div>
          {loading ? (
            <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader size={32} style={{ color: '#a855f7', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : topPrograms.length > 0 ? (
            <div
              onContextMenu={(e) => {
                e.preventDefault()
                // Find which bar was clicked based on Y position
                const chartArea = e.currentTarget.getBoundingClientRect()
                const relativeY = e.clientY - chartArea.top - 5 // account for margin
                const barHeight = 310 / topPrograms.length // approximate bar area height
                const barIndex = Math.floor(relativeY / barHeight)
                if (barIndex >= 0 && barIndex < topPrograms.length) {
                  setContextMenu({
                    show: true,
                    x: e.clientX,
                    y: e.clientY,
                    program: topPrograms[barIndex]
                  })
                }
              }}
            >
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={topPrograms}
                  layout="vertical"
                  margin={{ left: 0, right: 30, top: 5, bottom: 5 }}
                >
                  <defs>
                    {barColors.map((color, index) => (
                      <linearGradient key={`gradient-${index}`} id={`barGradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={color} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis
                    type="number"
                    tick={{ fill: '#a0a0b0', fontSize: 11 }}
                    axisLine={{ stroke: '#2a2a3a' }}
                    tickLine={{ stroke: '#2a2a3a' }}
                    tickFormatter={(value) => `${value} GB`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fill: '#e0e0e0', fontSize: 12, width: 135, textAnchor: 'end' }}
                    axisLine={{ stroke: '#2a2a3a' }}
                    tickLine={false}
                    interval={0}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }}
                    contentStyle={{
                      backgroundColor: '#1a1a24',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '8px',
                      color: '#f5f5f5',
                      boxShadow: '0 4px 20px rgba(168, 85, 247, 0.2)'
                    }}
                    formatter={(value, name, props) => [`${value} GB`, props.payload.fullName]}
                    labelStyle={{ color: '#a855f7', fontWeight: 500 }}
                  />
                  <Bar
                    dataKey="size"
                    shape={<CustomBar />}
                    style={{ cursor: 'context-menu' }}
                    animationDuration={800}
                    animationBegin={0}
                  />
                </BarChart>
              </ResponsiveContainer>
              {/* Size Legend */}
              <div style={{
                marginTop: '12px',
                padding: '10px 16px',
                backgroundColor: 'rgba(168, 85, 247, 0.05)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '12px', color: '#a0a0b0' }}>
                  Total from top 10:
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#a855f7' }}>
                  {topPrograms.reduce((sum, p) => sum + p.size, 0).toFixed(2)} GB
                </span>
              </div>
            </div>
          ) : (
            <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0' }}>
              No size data available
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 500 }}>
            Size by Category
          </h3>
          {loading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader size={32} style={{ color: '#a855f7', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <defs>
                    {categoryData.map((entry, index) => (
                      <linearGradient key={`pieGradient-${index}`} id={`pieGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={800}
                    animationBegin={0}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#pieGradient-${index})`}
                        stroke={entry.color}
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a24',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '8px',
                      color: '#f5f5f5',
                      boxShadow: '0 4px 20px rgba(168, 85, 247, 0.2)'
                    }}
                    formatter={(value, name) => [`${value} GB`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Enhanced Legend */}
              <div style={{
                marginTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '12px',
                backgroundColor: 'rgba(30, 30, 40, 0.5)',
                borderRadius: '8px'
              }}>
                {categoryData.map((cat) => {
                  const totalValue = categoryData.reduce((sum, c) => sum + c.value, 0)
                  const percentage = totalValue > 0 ? ((cat.value / totalValue) * 100).toFixed(1) : 0
                  return (
                    <div
                      key={cat.name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(168, 85, 247, 0.03)',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.03)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '3px',
                            backgroundColor: cat.color,
                            boxShadow: `0 0 6px ${cat.color}40`
                          }}
                        />
                        <span style={{ color: '#e0e0e0' }}>{cat.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: '#a855f7', fontWeight: 500, minWidth: '50px', textAlign: 'right' }}>{cat.value} GB</span>
                        <span style={{
                          color: '#6b7280',
                          fontSize: '11px',
                          minWidth: '40px',
                          textAlign: 'right',
                          padding: '2px 6px',
                          backgroundColor: 'rgba(107, 114, 128, 0.1)',
                          borderRadius: '4px'
                        }}>{percentage}%</span>
                      </div>
                    </div>
                  )
                })}
                {/* Total */}
                <div style={{
                  marginTop: '6px',
                  paddingTop: '8px',
                  borderTop: '1px solid #2a2a3a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px'
                }}>
                  <span style={{ color: '#a0a0b0' }}>Total</span>
                  <span style={{ color: '#a855f7', fontWeight: 600 }}>
                    {categoryData.reduce((sum, c) => sum + c.value, 0).toFixed(2)} GB
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0' }}>
              No size data available
            </div>
          )}
        </div>
      </div>

      {/* New: Program Count by Category Chart */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>
            Programs by Category
          </h3>
          <span style={{ fontSize: '12px', color: '#a0a0b0', padding: '4px 10px', backgroundColor: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px' }}>
            Click to view programs
          </span>
        </div>
        {loading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader size={32} style={{ color: '#a855f7', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(() => {
              // Calculate program counts by category
              const categoryCounts = {}
              programs.forEach(p => {
                const cat = categorizeProgram(p)
                if (!categoryCounts[cat]) categoryCounts[cat] = 0
                categoryCounts[cat]++
              })
              const countData = Object.entries(categoryCounts)
                .map(([name, count]) => ({ name, count, color: categoryColors[name] || '#6b7280' }))
                .sort((a, b) => b.count - a.count)
              const maxCount = Math.max(...countData.map(c => c.count), 1)

              return countData.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{
                    width: '100px',
                    fontSize: '13px',
                    color: '#e0e0e0',
                    flexShrink: 0
                  }}>
                    {cat.name}
                  </span>
                  <div style={{
                    flex: 1,
                    height: '24px',
                    backgroundColor: 'rgba(42, 42, 58, 0.5)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${(cat.count / maxCount) * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${cat.color}80, ${cat.color})`,
                      borderRadius: '6px',
                      transition: 'width 0.5s ease',
                      boxShadow: `0 0 10px ${cat.color}40`
                    }} />
                  </div>
                  <span style={{
                    width: '60px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: cat.color
                  }}>
                    {cat.count} apps
                  </span>
                </div>
              ))
            })()}
          </div>
        )}
      </div>

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
              minWidth: '160px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ padding: '8px 12px', fontSize: '12px', color: '#a0a0b0', borderBottom: '1px solid #2a2a3a' }}>
              {contextMenu.program?.fullName}
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
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                if (contextMenu.program?.installLocation) {
                  e.currentTarget.style.backgroundColor = '#252532'
                }
              }}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Open File Location
            </button>
          </div>
        </>
      )}

      {/* Category Modal */}
      {categoryModal.show && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setCategoryModal({ show: false, category: null, programs: [] })}
          >
            <div
              style={{
                backgroundColor: '#1a1a24',
                border: '1px solid #2a2a3a',
                borderRadius: '12px',
                padding: '24px',
                width: '600px',
                maxHeight: '70vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      backgroundColor: categoryColors[categoryModal.category] || '#6b7280'
                    }}
                  />
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                    {categoryModal.category}
                  </h2>
                  <span style={{ fontSize: '14px', color: '#a0a0b0' }}>
                    ({categoryModal.programs.length} programs)
                  </span>
                </div>
                <button
                  onClick={() => setCategoryModal({ show: false, category: null, programs: [] })}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#a0a0b0',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0b0'}
                >
                  ×
                </button>
              </div>

              {/* Programs List */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#a0a0b0', fontSize: '12px', fontWeight: 500 }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#a0a0b0', fontSize: '12px', fontWeight: 500 }}>Publisher</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', color: '#a0a0b0', fontSize: '12px', fontWeight: 500 }}>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryModal.programs.map((program, index) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom: '1px solid #1e1e28',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '12px', fontSize: '13px', color: '#e0e0e0' }}>
                          {program.name}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#a0a0b0' }}>
                          {program.publisher || '—'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#a855f7', textAlign: 'right', fontWeight: 500 }}>
                          {formatSize(program.sizeBytes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #2a2a3a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '13px', color: '#a0a0b0' }}>
                  Total size:
                </span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#a855f7' }}>
                  {formatSize(categoryModal.programs.reduce((sum, p) => sum + (p.sizeBytes || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
