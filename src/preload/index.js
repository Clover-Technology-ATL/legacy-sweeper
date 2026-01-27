const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Program management APIs
  getInstalledPrograms: () => ipcRenderer.invoke('programs:getAll'),
  verifyProgram: (program) => ipcRenderer.invoke('programs:verify', program),
  uninstallProgram: (uninstallString) => ipcRenderer.invoke('programs:uninstall', uninstallString),
  openFileLocation: (folderPath) => ipcRenderer.invoke('programs:openLocation', folderPath),
  calculateSizes: (programs) => ipcRenderer.invoke('programs:calculateSizes', programs),
  clearSizeCache: () => ipcRenderer.invoke('programs:clearCache'),

  // System metrics APIs
  getSystemMetrics: () => ipcRenderer.invoke('system:getMetrics'),

  // Process management APIs for Recommendations tab
  getDetailedProcesses: () => ipcRenderer.invoke('processes:getDetailed'),
  terminateProcess: (pid) => ipcRenderer.invoke('processes:terminate', pid),
  terminateProcessByName: (name) => ipcRenderer.invoke('processes:terminateByName', name),
  runProcessAudit: (apiKey) => ipcRenderer.invoke('processes:audit', apiKey),
  hasEnvApiKey: () => ipcRenderer.invoke('processes:hasEnvKey')
})
