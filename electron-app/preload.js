const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onStatus: (callback) => ipcRenderer.on('status', (_event, msg) => callback(msg)),
});

contextBridge.exposeInMainWorld('epic', {
  authStart:      ()           => ipcRenderer.invoke('epic:auth-start'),
  fetchResources: (patientId)  => ipcRenderer.invoke('epic:fetch-resources', patientId),
  disconnect:     ()           => ipcRenderer.invoke('epic:disconnect'),
});

contextBridge.exposeInMainWorld('pacs', {
  connect:       (config)                          => ipcRenderer.invoke('pacs:connect', config),
  search:        (query)                           => ipcRenderer.invoke('pacs:search', query),
  openStudy:     (studyUid)                        => ipcRenderer.invoke('pacs:open-study', studyUid),
  fetchInstance: (studyUid, seriesUid, instUid)    => ipcRenderer.invoke('pacs:fetch-instance', studyUid, seriesUid, instUid),
  disconnect:    ()                                => ipcRenderer.invoke('pacs:disconnect'),
});
