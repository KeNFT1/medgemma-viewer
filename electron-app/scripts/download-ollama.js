const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');

// Use a recent stable version — MedGemma requires 0.6+ for Gemma3 support
const OLLAMA_VERSION = '0.15.6';
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
      fs.unlink(dest, () => { });
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
  let isZip = false;

  if (targetPlatform === 'darwin') {
    // macOS releases are now universal zips or we use the signed app zip
    downloadFilename = 'Ollama-darwin.zip';
    downloadUrl = `${BASE_URL}/${downloadFilename}`;
    finalFilename = 'ollama';
    isZip = true;
  } else if (targetPlatform === 'win32' && targetArch === 'x64') {
    downloadFilename = 'ollama-windows-amd64.zip';
    downloadUrl = `${BASE_URL}/${downloadFilename}`;
    finalFilename = 'ollama.exe';
    isZip = true;
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

    if (isZip) {
      console.log('Extracting Ollama binary from zip...');
      const tempExtractDir = path.join(BINARIES_DIR, 'temp_extract');
      if (!fs.existsSync(tempExtractDir)) fs.mkdirSync(tempExtractDir);

      try {
        const zip = new AdmZip(tempPath);
        zip.extractAllTo(tempExtractDir, true);

        // execSync(`unzip -q -o "${tempPath}" -d "${tempExtractDir}"`);

        let binarySource;
        if (targetPlatform === 'darwin') {
          binarySource = path.join(tempExtractDir, 'Ollama.app', 'Contents', 'Resources', 'ollama');
        } else {
          // Try to find the exe at root
          const potentialPath = path.join(tempExtractDir, 'ollama.exe');
          if (fs.existsSync(potentialPath)) {
            binarySource = potentialPath;
          } else {
            // Fallback: look for any .exe
            const files = fs.readdirSync(tempExtractDir);
            const exeFile = files.find(f => f.toLowerCase().endsWith('.exe'));
            if (exeFile) {
              binarySource = path.join(tempExtractDir, exeFile);
            }
          }
        }

        if (binarySource && fs.existsSync(binarySource)) {
          fs.renameSync(binarySource, finalPath);
          if (targetPlatform !== 'win32') fs.chmodSync(finalPath, '755');
        } else {
          throw new Error(`Binary not found in zip`);
        }

        // Cleanup
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
        fs.unlinkSync(tempPath); // remove zip

      } catch (e) {
        throw new Error(`Failed to extract zip: ${e.message}`);
      }

    } else {
      if (targetPlatform === 'darwin') {
        fs.chmodSync(tempPath, '755');
      }
      fs.renameSync(tempPath, finalPath);
    }

    console.log('Ollama binary downloaded and ready successfully at', finalPath);
  } catch (error) {
    console.error('Error downloading/extracting Ollama binary:', error);
    process.exit(1);
  }
}

main();
