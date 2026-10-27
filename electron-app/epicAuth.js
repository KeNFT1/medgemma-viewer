'use strict';

const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const path = require('path');

/** Path to the encrypted refresh token file */
const EPIC_TOKEN_PATH = () =>
  path.join(require('electron').app.getPath('userData'), 'epic_refresh.bin');

/**
 * Generates a cryptographically random PKCE code verifier.
 * @returns {string} 32-byte base64url-encoded string (no padding)
 */
function generateVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Derives the PKCE code challenge from a verifier.
 * @param {string} verifier
 * @returns {string} base64url(SHA-256(verifier))
 */
function generateChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Decodes the payload of a JWT without verifying the signature.
 * @param {string} token
 * @returns {Record<string, unknown>}
 */
function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length < 2) return {};
  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/**
 * Starts the Epic SMART on FHIR OAuth2 + PKCE authorization flow.
 *
 * @param {{
 *   clientId: string,
 *   epicBaseUrl: string,
 *   scopes: string,
 *   mainWindow: import('electron').BrowserWindow
 * }} opts
 * @returns {Promise<{ accessToken: string, patientId: string, patientName: string }>}
 */
function startEpicAuth({ clientId, epicBaseUrl, scopes, mainWindow }) {
  return new Promise((resolve, reject) => {
    const verifier = generateVerifier();
    const challenge = generateChallenge(verifier);
    const state = crypto.randomBytes(16).toString('base64url');

    let server;
    let settled = false;

    const finish = (err, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutHandle);
      server.close();
      if (err) reject(err);
      else resolve(result);
    };

    // 5-minute timeout
    const timeoutHandle = setTimeout(() => {
      finish(new Error('Epic OAuth timed out after 5 minutes'));
    }, 5 * 60 * 1000);

    server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url, 'http://127.0.0.1');
        if (reqUrl.pathname !== '/callback') {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const returnedState = reqUrl.searchParams.get('state');
        if (returnedState !== state) {
          res.writeHead(400);
          res.end('State mismatch');
          finish(new Error('OAuth state mismatch — possible CSRF'));
          return;
        }

        const error = reqUrl.searchParams.get('error');
        if (error) {
          const desc = reqUrl.searchParams.get('error_description') || error;
          res.writeHead(400);
          res.end(`Authorization error: ${desc}`);
          finish(new Error(`Epic auth error: ${desc}`));
          return;
        }

        const code = reqUrl.searchParams.get('code');
        if (!code) {
          res.writeHead(400);
          res.end('Missing authorization code');
          finish(new Error('Missing authorization code in callback'));
          return;
        }

        const port = server.address().port;
        const redirectUri = `http://127.0.0.1:${port}/callback`;

        // Exchange code for tokens using Electron's net.fetch (CORS-friendly)
        const { net } = require('electron');
        const tokenBody = new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          code,
          redirect_uri: redirectUri,
          code_verifier: verifier,
        });

        const tokenRes = await net.fetch(`${epicBaseUrl}/oauth2/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: tokenBody.toString(),
        });

        if (!tokenRes.ok) {
          const body = await tokenRes.text();
          res.writeHead(502);
          res.end('Token exchange failed');
          finish(new Error(`Token exchange failed (${tokenRes.status}): ${body}`));
          return;
        }

        const tokens = await tokenRes.json();

        // Persist refresh token encrypted
        if (tokens.refresh_token) {
          const { safeStorage } = require('electron');
          const enc = safeStorage.encryptString(tokens.refresh_token);
          fs.writeFileSync(EPIC_TOKEN_PATH(), enc);
        }

        // Decode patient info from id_token
        const idPayload = tokens.id_token ? decodeJwtPayload(tokens.id_token) : {};
        const patientId = tokens.patient || idPayload.patient || '';
        const patientName =
          idPayload.name ||
          [idPayload.given_name, idPayload.family_name].filter(Boolean).join(' ') ||
          '';

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(
          '<html><body><h2>Authorization successful. You may close this window.</h2></body></html>'
        );

        finish(null, {
          accessToken: tokens.access_token,
          patientId,
          patientName,
        });
      } catch (err) {
        res.writeHead(500);
        res.end('Internal error');
        finish(err);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const redirectUri = `http://127.0.0.1:${port}/callback`;

      const authUrl =
        `${epicBaseUrl}/oauth2/authorize` +
        `?response_type=code` +
        `&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&state=${state}` +
        `&code_challenge=${challenge}` +
        `&code_challenge_method=S256`;

      require('electron').shell.openExternal(authUrl).catch(reject);
    });

    server.on('error', (err) => finish(err));
  });
}

/**
 * Refreshes an Epic access token using the stored encrypted refresh token.
 *
 * @param {{ clientId: string, epicBaseUrl: string }} opts
 * @returns {Promise<string>} New access token
 */
async function epicRefreshToken({ clientId, epicBaseUrl }) {
  const { safeStorage, net } = require('electron');
  const tokenPath = EPIC_TOKEN_PATH();

  if (!fs.existsSync(tokenPath)) {
    throw new Error('No stored refresh token — user must re-authorize');
  }

  const encBuf = fs.readFileSync(tokenPath);
  const refreshToken = safeStorage.decryptString(encBuf);

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
  });

  const res = await net.fetch(`${epicBaseUrl}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  const tokens = await res.json();

  if (tokens.refresh_token) {
    const enc = safeStorage.encryptString(tokens.refresh_token);
    fs.writeFileSync(tokenPath, enc);
  }

  return tokens.access_token;
}

/**
 * Deletes the stored encrypted refresh token file, effectively signing the user out.
 */
function clearEpicTokens() {
  const tokenPath = EPIC_TOKEN_PATH();
  if (fs.existsSync(tokenPath)) {
    fs.unlinkSync(tokenPath);
  }
}

module.exports = {
  generateVerifier,
  generateChallenge,
  startEpicAuth,
  epicRefreshToken,
  clearEpicTokens,
};
