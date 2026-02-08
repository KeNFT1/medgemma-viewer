const { app, BrowserWindow } = require('electron');
const { createWindow } = require('../main');

jest.mock('electron', () => ({
  app: {
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    quit: jest.fn(),
  },
  BrowserWindow: jest.fn(() => ({
    loadFile: jest.fn(),
    webContents: {
      on: jest.fn(),
      send: jest.fn(),
    },
  })),
  dialog: {
    showErrorBox: jest.fn(),
    showMessageBox: jest.fn(() => Promise.resolve({ response: 0})),
  },
  ipcMain: {
    on: jest.fn(),
  },
}));

jest.mock('../main', () => ({
  ...jest.requireActual('../main'),
  isOllamaInstalled: jest.fn(() => true),
  isOllamaRunning: jest.fn(() => Promise.resolve(true)),
  isModelAvailable: jest.fn(() => Promise.resolve(true)),
  startOllama: jest.fn(() => Promise.resolve()),
  pullModel: jest.fn(() => Promise.resolve()),
}));

describe('createWindow', () => {
  it('should create a BrowserWindow', async () => {
    await createWindow();
    expect(BrowserWindow).toHaveBeenCalled();
  });

  it('should load index.html', async () => {
    await createWindow();
    const instance = BrowserWindow.mock.results[0].value;
    expect(instance.loadFile).toHaveBeenCalledWith('index.html');
  });
});
