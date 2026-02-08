const https = require('https');
const fs = require('fs');
const path = require('path');

const OLLAMA_VERSION = '0.1.32';
const BASE_URL = `https://github.com/ollama/ollama/releases/download/v${OLLAMA_VERSION}`;
const BINARIES_DIR = path.join(__dirname, '..', 'binaries');

if (!fs.existsSync(BINARIES_DIR)) {
  fs.mkdirSync(BINARIES_DIR, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  const targetPlatform = process.argv[2];
  const targetArch = process.argv[3];

  if (!targetPlatform || !targetArch) {
    console.error('Usage: node scripts/download-ollama.js <platform> <arch>');
    console.error('Example: node scripts/download-ollama.js win32 x64');
    process.exit(1);
  }

  let downloadUrl;
  let downloadFilename;
  let finalFilename;

  if (targetPlatform === 'darwin') {
    const ollamaArch = targetArch === 'arm64' ? 'arm64' : 'amd64';
    downloadFilename = `ollama-darwin-${ollamaArch}`;
    downloadUrl = `${BASE_URL}/${downloadFilename}`;
    finalFilename = 'ollama';
  } else if (targetPlatform === 'win32' && targetArch === 'x64') {
    downloadFilename = 'ollama-windows-amd64.exe';
    downloadUrl = `${BASE_URL}/${downloadFilename}`;
    finalFilename = 'ollama.exe';
  } else {
    console.log(`Skipping download for unsupported platform/architecture: ${targetPlatform} ${targetArch}`);
    return;
  }

  const finalPath = path.join(BINARIES_DIR, finalFilename);

  if (fs.existsSync(finalPath)) {
    console.log('Ollama binary already exists at', finalPath);
    return;
  }

  const tempPath = path.join(BINARIES_DIR, downloadFilename);

  console.log('Downloading Ollama from', downloadUrl, 'to', tempPath);

  try {
    await download(downloadUrl, tempPath);
    if (targetPlatform === 'darwin') {
      fs.chmodSync(tempPath, '755');
    }
    fs.renameSync(tempPath, finalPath);
    console.log('Ollama binary downloaded and renamed successfully.');
  } catch (error) {
    console.error('Error downloading Ollama binary:', error);
    process.exit(1);
  }
}

main();
