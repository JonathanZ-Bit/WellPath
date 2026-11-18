import fs from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';

let cachedKey = null;
let cachedExpiresAt = 0;

function readEnv(contents, name) {
  const line = contents.split(/\r?\n/).find((item) => item.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim();
}

async function loadConfig() {
  if (process.env.VERCEL) {
    return {
      url: process.env.KEYGEN_URL,
      token: process.env.KEYGEN_TOKEN
    };
  }

  const contents = await fs.readFile(new URL('../.env', import.meta.url), 'utf8');
  return {
    url: readEnv(contents, 'KEYGEN_URL'),
    token: readEnv(contents, 'KEYGEN_TOKEN')
  };
}

function problem(message, fix) {
  const error = new Error(message);
  error.fix = fix;
  return error;
}

function isUsableCache() {
  return cachedKey && Date.now() < cachedExpiresAt;
}

function clearCache() {
  cachedKey = null;
  cachedExpiresAt = 0;
}

async function requestKey() {
  const { url, token } = await loadConfig();
  if (!url || url === 'paste-here' || !token || token === 'paste-here') {
    throw problem('I could not connect right now.', 'Add KEYGEN_URL and KEYGEN_TOKEN to .env.');
  }

  let response;
  try {
    response = await postJson(`${url.replace(/\/+$/, '')}/api/lookup-key`, { Authorization: `Bearer ${token}` });
  } catch {
    throw problem('I could not connect right now.', 'Check KEYGEN_URL and the network connection.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw problem('I could not connect right now.', `MindDo returned non-JSON data (HTTP ${response.status}).`);
  }

  if (!response.ok || !data?.apiKey || !data?.expiresAt) {
    throw problem('I could not get an AI key right now.', data?.error?.fix || `MindDo key lookup failed (HTTP ${response.status}).`);
  }

  const expiresAt = Date.parse(data.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw problem('I could not get a usable AI key right now.', 'MindDo returned an invalid or expired expiresAt value.');
  }

  cachedKey = data.apiKey;
  cachedExpiresAt = expiresAt;
  return cachedKey;
}

function postJson(url, headers) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const transport = target.protocol === 'http:' ? http : https;
    const request = transport.request(target, { method: 'POST', headers }, (response) => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { text += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, ok: response.statusCode >= 200 && response.statusCode < 300, json: async () => JSON.parse(text) }));
    });
    request.on('error', reject);
    request.end();
  });
}

export async function getKey() {
  if (isUsableCache()) return cachedKey;
  clearCache();
  return requestKey();
}

export function invalidateKey() {
  clearCache();
}
