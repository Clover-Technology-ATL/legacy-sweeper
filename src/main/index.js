const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const { promisify } = require('util')
const Anthropic = require('@anthropic-ai/sdk')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const execAsync = promisify(exec)

// Cache file for program sizes
const CACHE_FILE = path.join(app.getPath('userData'), 'program-sizes-cache.json')

// Load cache from disk
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load cache:', e)
  }
  return {}
}

// Save cache to disk
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
  } catch (e) {
    console.error('Failed to save cache:', e)
  }
}

// Global cache
let sizeCache = {}

// ============ SYSTEM METRICS (Using Performance Counters - same as Task Manager) ============

// Get CPU usage - use shell: powershell.exe to avoid cmd.exe escaping issues
async function getCpuUsage() {
  try {
    const { stdout } = await execAsync(
      '[math]::Round((Get-Counter "\\Processor(_Total)\\% Processor Time").CounterSamples.CookedValue)',
      { encoding: 'utf8', timeout: 5000, shell: 'powershell.exe' }
    )
    return parseInt(stdout.trim(), 10) || 0
  } catch (e) {
    console.error('CPU error:', e.message)
    return 0
  }
}

// Get memory usage
async function getMemoryUsage() {
  try {
    const { stdout } = await execAsync(
      '$m=Get-CimInstance Win32_OperatingSystem; $t=$m.TotalVisibleMemorySize*1KB; $f=$m.FreePhysicalMemory*1KB; $u=$t-$f; "$t|$u|$f|$([math]::Round($u/$t*100))"',
      { encoding: 'utf8', timeout: 5000, shell: 'powershell.exe' }
    )
    const [total, used, free, percent] = stdout.trim().split('|').map(Number)
    return { total, used, free, percent }
  } catch (e) {
    console.error('Memory error:', e.message)
    return { total: 0, used: 0, free: 0, percent: 0 }
  }
}

// Get disk usage
async function getDiskUsage() {
  try {
    const { stdout } = await execAsync(
      "$d=Get-CimInstance Win32_LogicalDisk -Filter \"DeviceID='C:'\"; $u=$d.Size-$d.FreeSpace; \"$($d.Size)|$u|$($d.FreeSpace)|$([math]::Round($u/$d.Size*100))\"",
      { encoding: 'utf8', timeout: 5000, shell: 'powershell.exe' }
    )
    const [total, used, free, percent] = stdout.trim().split('|').map(Number)
    return { total, used, free, percent }
  } catch (e) {
    console.error('Disk error:', e.message)
    return { total: 0, used: 0, free: 0, percent: 0 }
  }
}

// Get top processes
async function getTopProcesses() {
  try {
    const { stdout } = await execAsync(
      'Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 10 | ForEach-Object { "$($_.Name)|$([math]::Round($_.WorkingSet64/1MB))" }',
      { encoding: 'utf8', timeout: 5000, shell: 'powershell.exe' }
    )
    const lines = stdout.trim().split('\n').filter(l => l.trim())
    return lines.map((line, i) => {
      const [name, memory] = line.trim().split('|')
      return {
        name: name || 'Unknown',
        memory: parseInt(memory, 10) || 0,
        color: ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ef4444'][i % 5]
      }
    })
  } catch (e) {
    console.error('Process error:', e.message)
    return []
  }
}

// Get all metrics
async function getSystemMetrics() {
  const [cpu, memory, disk, processes] = await Promise.all([
    getCpuUsage(),
    getMemoryUsage(),
    getDiskUsage(),
    getTopProcesses()
  ])
  return { cpu, memory, disk, processes }
}

// ============ END SYSTEM METRICS ============

// ============ PROCESS MANAGEMENT FOR RECOMMENDATIONS TAB ============

// Get detailed processes with real-time CPU percentage and memory usage
async function getDetailedProcesses() {
  try {
    // Use two samples 500ms apart to calculate real-time CPU usage (like Task Manager)
    const { stdout } = await execAsync(
      `$cpuCores = (Get-CimInstance Win32_Processor).NumberOfLogicalProcessors
$procs1 = @{}
Get-Process | Where-Object { $_.Id -ne 0 -and $_.Id -ne 4 } | ForEach-Object {
  $procs1[$_.Id] = @{ Name = $_.Name; CPU = $_.CPU; Mem = $_.WorkingSet64 }
}
Start-Sleep -Milliseconds 500
$results = @()
Get-Process | Where-Object { $_.Id -ne 0 -and $_.Id -ne 4 } | ForEach-Object {
  $cpu = 0
  if ($procs1.ContainsKey($_.Id)) {
    $cpuDelta = $_.CPU - $procs1[$_.Id].CPU
    $cpu = [math]::Round($cpuDelta / 0.5 * 100 / $cpuCores, 1)
    if ($cpu -lt 0) { $cpu = 0 }
    if ($cpu -gt 100) { $cpu = 100 }
  }
  $results += "$($_.Id)|$($_.Name)|$cpu|$($_.WorkingSet64)"
}
$results | Sort-Object { [double]($_ -split '\\|')[2] } -Descending | Select-Object -First 50`,
      { encoding: 'utf8', timeout: 20000, shell: 'powershell.exe' }
    )
    const lines = stdout.trim().split('\n').filter(l => l.trim())
    return lines.map(line => {
      const [pid, name, cpu, memoryBytes] = line.trim().split('|')
      return {
        pid: parseInt(pid, 10),
        name: name || 'Unknown',
        cpu: parseFloat(cpu) || 0,
        memoryBytes: parseInt(memoryBytes, 10) || 0
      }
    })
  } catch (e) {
    console.error('Detailed process error:', e.message)
    return []
  }
}

// Terminate a process by PID
async function terminateProcess(pid) {
  try {
    await execAsync(
      `Stop-Process -Id ${pid} -Force`,
      { encoding: 'utf8', timeout: 5000, shell: 'powershell.exe' }
    )
    return { success: true }
  } catch (e) {
    console.error('Terminate process error:', e.message)
    return { success: false, error: e.message }
  }
}

// Terminate all processes with a given name
async function terminateProcessByName(name) {
  try {
    const { stdout } = await execAsync(
      `Stop-Process -Name "${name}" -Force; Write-Output "stopped"`,
      { encoding: 'utf8', timeout: 10000, shell: 'powershell.exe' }
    )
    return { success: true }
  } catch (e) {
    console.error('Terminate process by name error:', e.message)
    return { success: false, error: e.message }
  }
}

// ============ END PROCESS MANAGEMENT ============

// ============ AI AUDIT ============

// Get all processes with more details for audit (uses real-time CPU sampling)
async function getAllProcessesForAudit() {
  try {
    // Sample CPU usage over 1 second for accurate real-time measurement
    const { stdout } = await execAsync(
      `$cpuCores = (Get-CimInstance Win32_Processor).NumberOfLogicalProcessors
$procs1 = @{}
Get-Process | Where-Object { $_.Id -ne 0 -and $_.Id -ne 4 } | ForEach-Object {
  $procs1[$_.Id] = @{ Name = $_.Name; CPU = $_.CPU; Mem = $_.WorkingSet64; Desc = $_.Description }
}
Start-Sleep -Seconds 1
Get-Process | Where-Object { $_.Id -ne 0 -and $_.Id -ne 4 } | ForEach-Object {
  $cpu = 0
  $desc = $_.Description
  if ($procs1.ContainsKey($_.Id)) {
    $cpuDelta = $_.CPU - $procs1[$_.Id].CPU
    $cpu = [math]::Round($cpuDelta * 100 / $cpuCores, 1)
    if ($cpu -lt 0) { $cpu = 0 }
    if ($cpu -gt 100) { $cpu = 100 }
    if (-not $desc) { $desc = $procs1[$_.Id].Desc }
  }
  "$($_.Id)|$($_.Name)|$cpu|$([math]::Round($_.WorkingSet64/1MB))|$desc"
}`,
      { encoding: 'utf8', timeout: 30000, shell: 'powershell.exe', maxBuffer: 10 * 1024 * 1024 }
    )
    const lines = stdout.trim().split('\n').filter(l => l.trim())
    return lines.map(line => {
      const [pid, name, cpu, memory, description] = line.trim().split('|')
      return {
        pid: parseInt(pid, 10),
        name: name || 'Unknown',
        cpu: parseFloat(cpu) || 0,
        memoryMB: parseInt(memory, 10) || 0,
        description: description || ''
      }
    })
  } catch (e) {
    console.error('Audit process error:', e.message)
    return []
  }
}

// Run AI audit on processes
async function runProcessAudit(apiKeyOverride) {
  const apiKey = apiKeyOverride || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('No API key found. Set ANTHROPIC_API_KEY in .env file.')
  }

  const processes = await getAllProcessesForAudit()

  // Group and summarize processes to reduce token usage
  const processMap = new Map()
  for (const p of processes) {
    if (processMap.has(p.name)) {
      const existing = processMap.get(p.name)
      existing.count++
      existing.totalMemory += p.memoryMB
      existing.totalCpu += p.cpu
    } else {
      processMap.set(p.name, {
        name: p.name,
        description: p.description,
        count: 1,
        totalMemory: p.memoryMB,
        totalCpu: p.cpu
      })
    }
  }

  const summary = Array.from(processMap.values())
    .sort((a, b) => b.totalMemory - a.totalMemory)
    .slice(0, 75) // Top 75 by memory
    .map(p => `${p.name} (${p.count}x, ${p.totalMemory}MB, ${p.totalCpu.toFixed(1)}% CPU)${p.description ? ` - ${p.description}` : ''}`)
    .join('\n')

  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are a Windows security and performance expert. Analyze these running processes and provide a comprehensive audit.

RUNNING PROCESSES (name, instance count, total memory MB, total CPU %, description):
${summary}

Use this knowledge for your analysis:

**LEGITIMATE PROCESS PATTERNS:**
- svchost.exe: Should have multiple instances, all children of services.exe, running as SYSTEM/LOCAL SERVICE/NETWORK SERVICE
- csrss.exe, wininit.exe, winlogon.exe: Critical Windows processes, should have 1-2 instances
- explorer.exe: Windows shell, typically 1 instance per user session
- RuntimeBroker.exe: Manages UWP app permissions, multiple instances normal
- System (PID 4): Kernel-level process, parent of smss.exe

**SUSPICIOUS INDICATORS:**
- Processes in unusual locations (windows\\temp\\sys is a known malware path)
- certutil.exe with decode flags (malware decoding technique)
- regsvr32.exe or rundll32.exe spawning unexpected processes (injection technique)
- Multiple instances of processes that should be unique
- Misspelled system process names (scvhost, svch0st, etc.)
- High network activity from unexpected processes

**COMMONLY UNNECESSARY/BLOATWARE:**
- DiagTrack (Connected User Experiences and Telemetry) - Microsoft telemetry
- WerSvc (Windows Error Reporting) - Can be disabled safely
- PcaSvc (Program Compatibility Assistant) - Rarely needed
- SysMain/Superfetch - Unnecessary with SSD + sufficient RAM
- OneDrive, Cortana, Xbox services - If unused
- Manufacturer bloatware (Dell, HP, Lenovo utilities)
- Adobe/Java updaters running constantly

**CLEAN WINDOWS BASELINE:**
- A clean Windows 11 runs ~100-120 processes at idle
- Over 150 processes with no apps open indicates bloat
- Background services causing 30-40% more processes is common bloat

Provide your audit with these sections:

## Security Analysis
- Any suspicious processes or patterns that need investigation
- Processes that could indicate compromise or malware
- Known malicious signatures or behaviors detected

## Performance Optimization
- Processes using excessive resources (high memory/CPU)
- Redundant processes (multiple instances where one would suffice)
- Resource-heavy apps that could be optimized

## Bloatware & Telemetry
- Unnecessary Microsoft telemetry/services that can be disabled
- Manufacturer bloatware or pre-installed apps
- Background services providing no user benefit

## Recommendations
- Prioritized list of 5-7 specific actions to take
- For each: process name, what it does, and whether to disable/uninstall/investigate
- Include any services to disable via services.msc

Be specific with exact process names. Flag anything suspicious for investigation. Use markdown formatting with **bold** for process names.`
    }]
  })

  // Calculate cost (Claude 3.5 Sonnet pricing: $3/1M input, $15/1M output)
  const inputCost = (response.usage.input_tokens / 1000000) * 3
  const outputCost = (response.usage.output_tokens / 1000000) * 15
  const totalCost = inputCost + outputCost

  return {
    text: response.content[0].text,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cost: totalCost
    }
  }
}

// ============ END AI AUDIT ============

// Get folder size using PowerShell (more reliable)
async function getFolderSize(folderPath) {
  if (!folderPath) return 0

  try {
    // Use PowerShell with a reasonable timeout
    const escapedPath = folderPath.replace(/'/g, "''")
    const { stdout } = await execAsync(
      `powershell -NoProfile -Command "(Get-ChildItem -LiteralPath '${escapedPath}' -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum"`,
      { encoding: 'utf8', timeout: 10000 }
    )
    const size = parseInt(stdout.trim(), 10)
    return isNaN(size) ? 0 : size
  } catch (e) {
    return 0
  }
}

// Open folder in explorer
function openFileLocation(folderPath) {
  if (folderPath) {
    shell.openPath(folderPath)
  }
}

// Query Windows Registry for installed programs
async function getInstalledPrograms() {
  const registryPaths = [
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
  ]

  const programs = []
  const seenNames = new Set()

  for (const regPath of registryPaths) {
    try {
      // Get all subkeys
      const { stdout: keysOutput } = await execAsync(
        `reg query "${regPath}"`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      )

      const subkeys = keysOutput
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('HKEY'))

      // Query each subkey for program details
      for (const subkey of subkeys) {
        try {
          const { stdout: values } = await execAsync(
            `reg query "${subkey}"`,
            { encoding: 'utf8', maxBuffer: 1024 * 1024 }
          )

          const getValue = (name) => {
            const regex = new RegExp(`^\\s*${name}\\s+REG_[A-Z_]+\\s+(.*)$`, 'mi')
            const match = values.match(regex)
            return match ? match[1].trim() : null
          }

          const displayName = getValue('DisplayName')
          if (!displayName || seenNames.has(displayName.toLowerCase())) continue

          // Skip system components and updates
          const systemComponent = getValue('SystemComponent')
          const parentKeyName = getValue('ParentKeyName')
          if (systemComponent === '1' || parentKeyName) continue

          seenNames.add(displayName.toLowerCase())

          const uninstallString = getValue('UninstallString') || getValue('QuietUninstallString')
          const installLocation = getValue('InstallLocation')
          const estimatedSize = getValue('EstimatedSize')
          const installDateRaw = getValue('InstallDate')
          const publisher = getValue('Publisher')

          // Parse install date (YYYYMMDD format) and format as US (MM/DD/YYYY)
          let installDate = null
          let installDateSort = null
          if (installDateRaw && /^\d{8}$/.test(installDateRaw)) {
            const year = installDateRaw.substring(0, 4)
            const month = installDateRaw.substring(4, 6)
            const day = installDateRaw.substring(6, 8)
            installDate = `${month}/${day}/${year}` // US format
            installDateSort = `${year}-${month}-${day}` // For sorting
          }

          // Get size from EstimatedSize (in KB) - will calculate folder size later
          const sizeKB = estimatedSize ? parseInt(estimatedSize, 10) : 0
          const sizeBytes = sizeKB * 1024

          // Determine status based on install date
          let status = 'moderate'
          if (installDateSort) {
            const installTime = new Date(installDateSort).getTime()
            const now = Date.now()
            const daysSinceInstall = (now - installTime) / (1000 * 60 * 60 * 24)
            if (daysSinceInstall < 90) status = 'recent'
            else if (daysSinceInstall > 365) status = 'unused'
          }

          programs.push({
            id: subkey,
            name: displayName,
            publisher: publisher || 'Unknown',
            sizeBytes: sizeBytes, // Raw bytes for sorting and display
            installDate: installDate || 'Unknown',
            installDateSort: installDateSort || '1970-01-01', // For sorting
            installLocation: installLocation || null,
            uninstallString: uninstallString || null,
            status
          })
        } catch (e) {
          // Skip entries we can't read
        }
      }
    } catch (e) {
      console.error(`Failed to query ${regPath}:`, e.message)
    }
  }

  // Sort by name
  programs.sort((a, b) => a.name.localeCompare(b.name))

  // Apply cached sizes (instant, no CPU usage)
  for (const program of programs) {
    if (program.sizeBytes === 0 && program.installLocation) {
      const cachedSize = sizeCache[program.installLocation]
      if (cachedSize !== undefined) {
        program.sizeBytes = cachedSize
      }
    }
  }

  return programs
}

// Calculate sizes in background (called separately)
async function calculateProgramSizes(programs) {
  const programsNeedingSize = programs.filter(p =>
    p.sizeBytes === 0 &&
    p.installLocation &&
    sizeCache[p.installLocation] === undefined
  )

  if (programsNeedingSize.length === 0) return programs

  // Process in small batches with delays to reduce CPU impact
  const batchSize = 3 // Smaller batches = less CPU spike
  for (let i = 0; i < programsNeedingSize.length; i += batchSize) {
    const batch = programsNeedingSize.slice(i, i + batchSize)
    const sizePromises = batch.map(async (program) => {
      const size = await getFolderSize(program.installLocation)
      program.sizeBytes = size
      sizeCache[program.installLocation] = size
    })
    await Promise.all(sizePromises)

    // Small delay between batches to reduce CPU pressure
    if (i + batchSize < programsNeedingSize.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // Save cache after calculating
  saveCache(sizeCache)

  return programs
}

// Verify a program is actually installed
async function verifyInstallation(program) {
  if (program.installLocation) {
    try {
      const { stdout } = await execAsync(`if exist "${program.installLocation}" (echo EXISTS) else (echo MISSING)`, { shell: 'cmd.exe' })
      return stdout.trim() === 'EXISTS'
    } catch (e) {
      return false
    }
  }
  // If no install location, assume it exists if it has an uninstall string
  return !!program.uninstallString
}

// Execute uninstall command
async function uninstallProgram(uninstallString) {
  if (!uninstallString) {
    throw new Error('No uninstall command available')
  }

  // Clean up the uninstall string
  let cmd = uninstallString

  // Handle MsiExec uninstalls - add /passive for less intrusive UI
  if (cmd.toLowerCase().includes('msiexec')) {
    if (!cmd.toLowerCase().includes('/quiet') && !cmd.toLowerCase().includes('/passive')) {
      cmd = cmd.replace(/msiexec\.exe/i, 'msiexec.exe /passive')
    }
  }

  return new Promise((resolve, reject) => {
    exec(cmd, { shell: 'cmd.exe' }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Uninstall failed: ${error.message}`))
      } else {
        resolve({ success: true, stdout, stderr })
      }
    })
  })
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0f0f14',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// Window control handlers
ipcMain.on('window:minimize', () => {
  BrowserWindow.getFocusedWindow()?.minimize()
})

ipcMain.on('window:maximize', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.on('window:close', () => {
  BrowserWindow.getFocusedWindow()?.close()
})

// Program management handlers
ipcMain.handle('programs:getAll', async () => {
  try {
    const programs = await getInstalledPrograms()
    return { success: true, programs }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('programs:verify', async (event, program) => {
  try {
    const exists = await verifyInstallation(program)
    return { success: true, exists }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('programs:uninstall', async (event, uninstallString) => {
  try {
    const result = await uninstallProgram(uninstallString)
    return { success: true, result }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('programs:openLocation', async (event, folderPath) => {
  try {
    if (folderPath) {
      await shell.openPath(folderPath)
      return { success: true }
    }
    return { success: false, error: 'No folder path provided' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Calculate sizes in background - returns updated programs
ipcMain.handle('programs:calculateSizes', async (event, programs) => {
  try {
    const updated = await calculateProgramSizes(programs)
    return { success: true, programs: updated }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Clear the size cache
ipcMain.handle('programs:clearCache', async () => {
  try {
    sizeCache = {}
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE)
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// System metrics handler
ipcMain.handle('system:getMetrics', async () => {
  try {
    const metrics = await getSystemMetrics()
    return { success: true, metrics }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Process management handlers for Recommendations tab
ipcMain.handle('processes:getDetailed', async () => {
  try {
    const processes = await getDetailedProcesses()
    return { success: true, processes }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('processes:terminate', async (event, pid) => {
  try {
    const result = await terminateProcess(pid)
    return result
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('processes:terminateByName', async (event, name) => {
  try {
    const result = await terminateProcessByName(name)
    return result
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('processes:audit', async (event, apiKey) => {
  try {
    const result = await runProcessAudit(apiKey)
    return { success: true, audit: result.text, usage: result.usage }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('processes:hasEnvKey', async () => {
  return { hasKey: !!process.env.ANTHROPIC_API_KEY }
})

app.whenReady().then(() => {
  // Load size cache on startup
  sizeCache = loadCache()
  console.log(`Loaded ${Object.keys(sizeCache).length} cached program sizes`)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
