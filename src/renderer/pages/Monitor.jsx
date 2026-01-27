import React, { useState, useEffect } from 'react'
import { Cpu, MemoryStick, HardDrive, Activity, Loader } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'

const cardStyle = {
  backgroundColor: '#1a1a24',
  border: '1px solid #2a2a3a',
  borderRadius: '12px',
  padding: '20px',
}

// Format bytes to human readable
function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const gb = bytes / (1024 * 1024 * 1024)
  const mb = bytes / (1024 * 1024)
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  if (mb >= 1) return `${mb.toFixed(0)} MB`
  return `${bytes} B`
}

function MetricCard({ title, value, unit, icon: Icon, color, percentage, chartData }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Icon size={18} style={{ color }} />
            <span style={{ color: '#a0a0b0', fontSize: '14px' }}>{title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '32px', fontWeight: 600 }}>{value}</span>
            <span style={{ color: '#a0a0b0', fontSize: '14px' }}>{unit}</span>
          </div>
        </div>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: `conic-gradient(${color} ${percentage * 3.6}deg, #252532 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#1a1a24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            {percentage}%
          </div>
        </div>
      </div>

      {/* Mini chart */}
      <ResponsiveContainer width="100%" height={60}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${title})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function ProcessList({ processes, loading }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 500 }}>
        Top Processes (by CPU Time)
      </h3>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader size={24} style={{ color: '#a855f7', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {processes.map((proc, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                backgroundColor: '#252532',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: proc.color + '20',
                  color: proc.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {index + 1}
                </span>
                <span style={{ fontSize: '14px' }}>{proc.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
                <span style={{ color: '#10b981' }}>{proc.memory} MB</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Monitor() {
  const [cpuData, setCpuData] = useState([])
  const [memoryData, setMemoryData] = useState([])
  const [diskData, setDiskData] = useState([])

  const [metrics, setMetrics] = useState({
    cpu: 0,
    memory: { total: 0, used: 0, percent: 0 },
    disk: { total: 0, used: 0, percent: 0 }
  })

  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch real system metrics
  const fetchMetrics = async () => {
    try {
      const result = await window.electronAPI.getSystemMetrics()
      if (result.success) {
        const { cpu, memory, disk, processes: procs } = result.metrics

        setMetrics({ cpu, memory, disk })
        setProcesses(procs)

        // Update chart data
        setCpuData(prev => {
          const newData = [...prev.slice(-19), { time: Date.now(), value: cpu }]
          return newData.length < 20 ? [...Array(20 - newData.length).fill({ value: 0 }), ...newData] : newData
        })
        setMemoryData(prev => {
          const newData = [...prev.slice(-19), { time: Date.now(), value: memory.percent }]
          return newData.length < 20 ? [...Array(20 - newData.length).fill({ value: 0 }), ...newData] : newData
        })
        setDiskData(prev => {
          const newData = [...prev.slice(-19), { time: Date.now(), value: disk.percent }]
          return newData.length < 20 ? [...Array(20 - newData.length).fill({ value: 0 }), ...newData] : newData
        })

        setLoading(false)
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
    }
  }

  useEffect(() => {
    // Initialize chart data
    const initialData = Array(20).fill({ time: 0, value: 0 })
    setCpuData(initialData)
    setMemoryData(initialData)
    setDiskData(initialData)

    // Fetch immediately
    fetchMetrics()

    // Then fetch every 2 seconds (less CPU intensive than 1 second)
    const interval = setInterval(fetchMetrics, 2000)

    return () => clearInterval(interval)
  }, [])

  // Calculate memory values
  const memoryUsedGB = (metrics.memory.used / (1024 * 1024 * 1024)).toFixed(1)
  const memoryTotalGB = (metrics.memory.total / (1024 * 1024 * 1024)).toFixed(0)

  // Calculate disk values
  const diskUsedGB = (metrics.disk.used / (1024 * 1024 * 1024)).toFixed(0)
  const diskTotalGB = (metrics.disk.total / (1024 * 1024 * 1024)).toFixed(0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Main metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <MetricCard
          title="CPU Usage"
          value={metrics.cpu}
          unit="%"
          icon={Cpu}
          color="#3b82f6"
          percentage={metrics.cpu}
          chartData={cpuData}
        />
        <MetricCard
          title="Memory"
          value={memoryUsedGB}
          unit={`GB / ${memoryTotalGB} GB`}
          icon={MemoryStick}
          color="#10b981"
          percentage={metrics.memory.percent}
          chartData={memoryData}
        />
        <MetricCard
          title="Disk (C:)"
          value={diskUsedGB}
          unit={`GB / ${diskTotalGB} GB`}
          icon={HardDrive}
          color="#a855f7"
          percentage={metrics.disk.percent}
          chartData={diskData}
        />
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <ProcessList processes={processes} loading={loading} />

        {/* System info */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 500 }}>
            System Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'OS', value: 'Windows 11 Pro' },
              { label: 'Processor', value: 'AMD Ryzen 7 9800X3D' },
              { label: 'RAM', value: `${memoryTotalGB} GB DDR5` },
              { label: 'GPU', value: 'NVIDIA RTX 5070 Ti 16GB' },
              { label: 'Storage', value: `${diskTotalGB} GB (C: Drive)` },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: index < 4 ? '1px solid #2a2a3a' : 'none'
                }}
              >
                <span style={{ color: '#a0a0b0', fontSize: '14px' }}>{item.label}</span>
                <span style={{ fontSize: '14px' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Monitor
