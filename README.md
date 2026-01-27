# Legacy Sweeper

A modern Windows desktop app for visualizing and managing installed programs. Think of it as a beautiful alternative to Windows "Add or Remove Programs" with analytics, smart cleanup suggestions, and AI-powered insights.

![Windows](https://img.shields.io/badge/platform-Windows-blue)
![Electron](https://img.shields.io/badge/electron-latest-brightgreen)
![React](https://img.shields.io/badge/react-19-blue)

## Features

### Dashboard
- Overview metrics: total programs, disk usage, largest program, old programs count
- Top 10 largest programs bar chart with interactive tooltips
- Size by category donut chart (Microsoft, Development, Gaming, Creative, Communication, Utilities)
- Programs by category breakdown

### Programs
- Searchable, sortable table of all installed programs
- Columns: Name, Publisher, Size, Install Date, Status
- Size filter dropdown (Large/Medium/Small/Unknown)
- Right-click context menu (Open File Location, Uninstall)
- Multi-select for batch operations
- Confirmation modal before uninstalling

### Recommendations
- Real-time process monitor with CPU % and memory usage
- Sortable, searchable process table with pagination
- End Task functionality (single process or all by name)
- Color-coded rows based on resource usage
- **AI-powered process audit** using Claude API (optional)
- Professional PDF report export

## System Requirements

**Windows Only** - This application is designed exclusively for Windows and will not work on macOS or Linux.

| Requirement | Details |
|-------------|---------|
| OS | Windows 10 or Windows 11 |
| PowerShell | Version 5.1+ (included with Windows 10/11) |
| Node.js | Version 18 or higher |
| RAM | 4GB minimum |

### Why Windows Only?

Legacy Sweeper relies on Windows-specific features:
- **Windows Registry** - Queries installed program data from registry hives
- **PowerShell** - Used for folder size calculations and process management
- **Windows API** - Native uninstall command execution

These features have no direct equivalent on macOS or Linux, making cross-platform support impractical.

## Installation

```bash
# Clone the repository
git clone https://github.com/Clover-Technology-ATL/legacy-sweeper.git
cd legacy-sweeper

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## AI Process Audit Setup (Optional)

The Recommendations tab includes an AI-powered audit feature that analyzes your running processes for security concerns, bloatware, and optimization opportunities.

To enable this feature:

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Create a `.env` file in the project root:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```
3. Restart the application

The app will show "API Key Configured" when your key is detected. You can track your API usage with the built-in budget tracker.

## Tech Stack

- **Electron** - Desktop framework
- **React 19** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **jsPDF** - PDF generation
- **@anthropic-ai/sdk** - AI features

## How It Works

Legacy Sweeper queries the Windows Registry to find installed programs:
- `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`
- `HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall` (32-bit apps)
- `HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall` (per-user apps)

Program sizes are calculated using PowerShell and cached locally for fast subsequent loads.

Process information is gathered using PowerShell with real-time CPU sampling for accurate usage percentages.

## License

MIT
