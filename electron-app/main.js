const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow;
let ollamaProcess = null;
let ollamaBin = null;

// ── Helpers ──────────────────────────────────────────────

function findOllama() {
  const isWin = process.platform === 'win32';
  const bundledName = isWin ? 'ollama.exe' : 'ollama';
  const bundledPath = path.join(process.resourcesPath, 'binaries', bundledName);

  // Check main resources path
  if (fs.existsSync(bundledPath)) {
    if (!isWin) {
      fs.chmodSync(bundledPath, '755');
    }
    return bundledPath;
  }

  // Fallback: check nested or adjacent folders (sometimes helpful in different pack modes)
  const adjacentPath = path.join(app.getAppPath(), '..', 'binaries', bundledName);
  if (fs.existsSync(adjacentPath)) {
    return adjacentPath;
  }
  const home = process.env.HOME || process.env.USERPROFILE || '';

  let candidates;

  if (isWin) {
    const localApp = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    const progFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const progFiles86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    // Windows common install locations (Ollama installs to various places across versions)
    candidates = [
      path.join(localApp, 'Programs', 'Ollama', 'ollama.exe'),
      path.join(localApp, 'Ollama', 'ollama.exe'),
      path.join(localApp, 'Ollama', 'ollama app.exe'),
      path.join(progFiles, 'Ollama', 'ollama.exe'),
      path.join(progFiles86, 'Ollama', 'ollama.exe'),
      path.join(home, 'AppData', 'Local', 'Programs', 'Ollama', 'ollama.exe'),
      path.join(home, 'AppData', 'Local', 'Ollama', 'ollama.exe'),
      path.join(home, 'AppData', 'Local', 'Ollama', 'ollama app.exe'),
      'C:\\Ollama\\ollama.exe',
    ];

    // Try Windows where command
    try {
      const resolved = execSync('where ollama', { stdio: ['pipe', 'pipe', 'ignore'] })
        .toString()
        .trim()
        .split('\n')[0]
        .trim();
      if (resolved && !candidates.includes(resolved)) {
        candidates.unshift(resolved);
      }
    } catch {}

    // Also try PATH search via PowerShell (more reliable than 'where' in some setups)
    try {
      const resolved = execSync('powershell -Command "(Get-Command ollama -ErrorAction SilentlyContinue).Source"', { stdio: ['pipe', 'pipe', 'ignore'] })
        .toString()
        .trim();
      if (resolved && !candidates.includes(resolved)) {
        candidates.unshift(resolved);
      }
    } catch {}
  } else {
    // macOS / Linux common install locations
    candidates = [
      '/usr/local/bin/ollama',
      '/opt/homebrew/bin/ollama',
      '/usr/bin/ollama',
      path.join(home, '.local', 'bin', 'ollama'),
      path.join(home, 'bin', 'ollama'),
    ];

    // Try the shell's PATH via a login shell (picks up .zshrc / .bashrc)
    try {
      const resolved = execSync('/bin/zsh -lc "which ollama"', { stdio: ['pipe', 'pipe', 'ignore'] })
        .toString()
        .trim();
      if (resolved && !candidates.includes(resolved)) {
        candidates.unshift(resolved);
      }
    } catch { }

    try {
      const resolved = execSync('/bin/bash -lc "which ollama"', { stdio: ['pipe', 'pipe', 'ignore'] })
        .toString()
        .trim();
      if (resolved && !candidates.includes(resolved)) {
        candidates.unshift(resolved);
      }
    } catch { }
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function isOllamaInstalled() {
  ollamaBin = findOllama();
  return ollamaBin !== null;
}

function isOllamaRunning() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:11434/api/tags', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

function startOllama() {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32';
    const env = { ...process.env, OLLAMA_ORIGINS: '*' };

    const spawnOpts = {
      env,
      stdio: 'ignore',
      detached: false,
    };

    // On Windows, hide the console window that would otherwise appear
    if (isWin) {
      spawnOpts.windowsHide = true;
    }

    ollamaProcess = spawn(ollamaBin, ['serve'], spawnOpts);

    ollamaProcess.on('error', (err) => {
      console.error('Failed to start Ollama:', err);
      reject(err);
    });

    // Give it a few seconds to start
    let attempts = 0;
    const check = setInterval(async () => {
      attempts++;
      const running = await isOllamaRunning();
      if (running) {
        clearInterval(check);
        resolve();
      } else if (attempts > 15) {
        clearInterval(check);
        reject(new Error('Ollama did not start within 15 seconds'));
      }
    }, 1000);
  });
}

function isModelAvailable() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:11434/api/tags', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const found = json.models?.some((m) =>
            m.name.includes('medgemma-vision')
          );
          resolve(found);
        } catch {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
  });
}

async function pullModel(window) {
  return new Promise((resolve, reject) => {
    window.webContents.send('status', 'Pulling MedGemma model (~5 GB)... This may take a while.');

    const pull = spawn(ollamaBin, ['pull', 'hf.co/unsloth/medgemma-1.5-4b-it-GGUF:Q8_0']);

    pull.stdout.on('data', (data) => {
      console.log('pull stdout:', data.toString());
    });

    pull.stderr.on('data', (data) => {
      console.log('pull stderr:', data.toString());
    });

    pull.on('close', (code) => {
      if (code === 0) {
        // Create alias
        try {
          execSync(`"${ollamaBin}" cp hf.co/unsloth/medgemma-1.5-4b-it-GGUF:Q8_0 medgemma-vision`);
          resolve();
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error(`ollama pull exited with code ${code}`));
      }
    });
  });
}

// ── App lifecycle ────────────────────────────────────────

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: "Lulo's NOT a Health Copilot",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#0f1117',
    ...(process.platform === 'darwin' ? { titleBarStyle: 'hiddenInset' } : {}),
  });

  mainWindow.loadFile('index.html');

  // ── Startup checks ──
  if (!isOllamaInstalled()) {
    const isWin = process.platform === 'win32';
    const instructions = isWin
      ? 'Ollama is required but was not found on this PC.\n\n' +
        'To install Ollama:\n' +
        '1. Download from https://ollama.com/download\n' +
        '2. Run the installer\n' +
        '3. Restart this app after installation\n\n' +
        'If Ollama is already installed, make sure it\'s in your system PATH.'
      : 'Ollama is required but not installed.\n\nDownload it from: https://ollama.com/download\n\nThe app will now quit.';
    dialog.showErrorBox('Ollama Not Found', instructions);
    app.quit();
    return;
  }

  const running = await isOllamaRunning();
  if (!running) {
    try {
      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('status', 'Starting Ollama...');
      });
      await startOllama();
    } catch (err) {
      dialog.showErrorBox('Ollama Error', `Could not start Ollama:\n${err.message}`);
    }
  }

  // Check if model exists, pull if not
  const modelReady = await isModelAvailable();
  if (!modelReady) {
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Download Now', 'Cancel'],
      defaultId: 0,
      title: 'Model Required',
      message: 'The MedGemma vision model is not installed yet.',
      detail: 'This is a one-time ~5 GB download. Continue?',
    });

    if (response === 0) {
      try {
        await pullModel(mainWindow);
        mainWindow.webContents.send('status', 'Model ready!');
      } catch (err) {
        dialog.showErrorBox('Download Failed', `Could not pull model:\n${err.message}`);
      }
    }
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (ollamaProcess) {
    ollamaProcess.kill();
  }
  app.quit();
});

app.on('before-quit', () => {
  if (ollamaProcess) {
    ollamaProcess.kill();
  }
});

module.exports = { createWindow };
