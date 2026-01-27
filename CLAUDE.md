# Legacy Sweeper — Claude Code Prompt

## What We're Building

**Legacy Sweeper** is a Windows desktop app that helps users visualize and manage installed programs. Think of it as a beautiful, modern alternative to Windows "Add or Remove Programs" with analytics and smart cleanup suggestions.

---

## Tech Stack

- Electron (desktop framework)
- React (UI)
- Vite (bundler)
- Tailwind CSS (styling)
- Recharts (graphs)
- Lucide React (icons)
- @anthropic-ai/sdk (AI audit feature)
- jspdf (PDF report generation)
- dotenv (environment variable management)

---

## Design Direction

- **Dark mode** as the primary theme
- **Purple accent color** (#a855f7) for interactive elements, highlights, and graphs
- Clean, modern, slightly techy aesthetic
- Rounded corners, subtle borders, smooth transitions
- Soft purple glow effects on accent elements

---

## Layout

- **Left sidebar**: Navigation with icons + labels (collapsible)
- **Top header**: App title, maybe search or window controls
- **Main content area**: Changes based on selected tab

---

## MVP Features (Phase 1)

### Tab 1: Dashboard
- Metric cards showing key stats (total programs, disk space used, largest program, etc.)
- Bar chart of top 10 largest programs with gradient colors and summary
- Pie/donut chart showing disk usage by category (Games, Development, Utilities, etc.)
- Programs by category horizontal bar chart
- Enhanced legends with percentages and totals

### Tab 2: Programs
- Searchable, sortable table of all installed programs
- Columns: Name, Publisher, Size (with visual bar), Install Date, Status
- Status indicators: color-coded by recency of use (green = recent, yellow = moderate, red = unused/old)
- Uninstall button per row
- Multi-select for batch operations
- Confirmation modal before uninstalling

### Tab 3: Recommendations
- Real-time process monitor with CPU and memory usage
- Sortable columns (Name, PID, CPU %, Memory)
- Search/filter functionality
- Pagination with configurable items per page (10, 15, 25, 50)
- End Task functionality (single process or all by name)
- Color-coded rows based on resource usage
- AI-powered process audit using Claude API
- Professional PDF report export
- Budget tracking for API usage with localStorage persistence

---

## Future Features (Phase 2+)

- **Usage tab**: Track which programs are actually being used and how often
- **Cleanup tab**: Smart suggestions for programs to remove, batch uninstall queue
- **Settings tab**: Theme toggle, startup options, scan frequency

---

## Backend Needs

- Query Windows registry/WMI to get list of installed programs (name, publisher, size, install date, uninstall string)
- Ability to trigger uninstall commands
- Disk usage information

### IPC Handlers (implemented)

**Program Management:**
- `programs:getAll` - Query registry for installed programs
- `programs:verify` - Verify program existence
- `programs:uninstall` - Execute uninstall command
- `programs:openLocation` - Open file location in Explorer
- `programs:calculateSizes` - Calculate folder sizes with caching
- `programs:clearCache` - Clear size cache

**System Metrics:**
- `system:getMetrics` - Get system metrics (mock data currently)

**Process Management:**
- `processes:getDetailed` - Get running processes with real-time CPU % (two-sample 500ms)
- `processes:terminate` - Terminate process by PID
- `processes:terminateByName` - Terminate all processes by name
- `processes:audit` - Run AI audit via Anthropic API
- `processes:hasEnvKey` - Check if API key is configured in .env

---

## Notes

- Windows-only is fine
- Use mock data initially, then wire up real system calls
- Handle errors gracefully (registry queries can be messy)
- Some uninstalls may need admin elevation — handle with user prompts

---

## Development Environment

- Platform: Windows 11
- Shell: Node.js
- System: Skytech King 95 (AMD Ryzen 7 9800X3D, RTX 5070 Ti 16GB, 32GB DDR5, 2TB NVMe Gen4)

---

## Progress Tracker

### Completed
- [x] Project scaffold with Electron + React + Vite
- [x] Basic layout (sidebar, header, main content area)
- [x] Window controls (minimize, maximize, close)
- [x] **Real Windows program detection** - queries registry for installed programs:
  - HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall
  - HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall (32-bit apps)
  - HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall (per-user)
- [x] **Real uninstall functionality** - executes actual uninstall commands
- [x] **Programs tab** - fully functional with real data:
  - Sortable columns (name, publisher, size, date)
  - Size filter dropdown (Large/Medium/Small/Unknown)
  - Search functionality
  - Right-click context menu (Open File Location, Uninstall)
  - Multi-select batch operations
  - US date format (MM/DD/YYYY)
- [x] **Dashboard tab** - wired to real program data:
  - Real total programs count
  - Real total disk usage
  - Largest program detection
  - Old programs count (1yr+)
  - Top 10 bar chart with gradient colors and total summary
  - Auto-categorization pie chart with enhanced legend (percentages + totals)
  - Programs by category horizontal bar chart (new)
  - Right-click context menu on bar chart
- [x] **Size calculation with caching**:
  - PowerShell folder size calculation
  - Disk cache for instant subsequent loads
  - Background calculation with progress indicator
  - "Recalc Sizes" button to refresh cache
  - Low CPU usage (small batches with delays)
- [x] **Recommendations tab** - real-time process monitoring:
  - Real-time CPU % via two-sample measurement (500ms delay for accuracy)
  - Human-readable memory display (KB, MB, GB)
  - Sortable columns (Name, PID, CPU %, Memory)
  - Search/filter functionality
  - Pagination with configurable items per page (10, 15, 25, 50)
  - Color-coded rows (red for high usage, yellow for moderate)
  - End Task functionality:
    - Single process termination by PID
    - "End All" to terminate all processes by name (e.g., all Chrome processes)
    - Confirmation modal before termination
  - AI-powered process audit:
    - Integration with Anthropic Claude API
    - Detailed security and performance analysis
    - Bloatware detection and recommendations
    - API key stored in .env file
    - Budget tracking with localStorage persistence
  - Professional PDF report export:
    - Clean formatting with stripped emojis
    - Purple accent styling
    - Executive summary and detailed findings

### In Progress / Next Steps
- [ ] **Monitor tab**: Wire up to real system metrics (currently mock)
  - Real CPU usage via performance counters
  - Real memory usage
  - Real disk activity
  - Real network stats
- [ ] **Admin elevation**: Prompt for UAC when needed for certain uninstalls

### Future (Phase 2+)
- [ ] Usage tab - track which programs are being launched
- [ ] Cleanup tab with smart suggestions
- [ ] Settings tab
- [ ] Theme toggle
