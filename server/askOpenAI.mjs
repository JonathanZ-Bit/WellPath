import https from 'node:https';
import fs from 'node:fs/promises';
import { getKey, invalidateKey } from './getKey.mjs';

function postJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, { method: 'POST', headers }, (response) => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { text += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, ok: response.statusCode >= 200 && response.statusCode < 300, json: async () => JSON.parse(text) }));
    });
    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

async function readModel() {
  const notes = await fs.readFile('NOTES.md', 'utf8');
  return notes.match(/gpt-[\w.-]*luna[\w.-]*/i)?.[0] || 'gpt-5.6-luna';
}

async function readInstructions() {
  const brief = await fs.readFile('BRIEF.md', 'utf8');
  return brief.slice(brief.indexOf('## My AI’s instructions'));
}

export async function askOpenAI(userMessage) {
  const [model, instructions] = await Promise.all([readModel(), readInstructions()]);
  let apiKey = await getKey();
  let response = await callOpenAI(apiKey, model, instructions, userMessage);

  if (response.status === 401 || response.status === 403) {
    invalidateKey();
    apiKey = await getKey();
    response = await callOpenAI(apiKey, model, instructions, userMessage);
  }

  if (!response.ok) {
    throw Object.assign(new Error('I could not get an AI answer right now.'), {
      fix: `OpenAI request failed (HTTP ${response.status}).`
    });
  }

  const data = await response.json();
  return data.output_text?.trim() || data.output?.flatMap((item) => item.content || []).map((part) => part.text || '').join('').trim() || 'I could not make a helpful answer this time.';
}

function callOpenAI(apiKey, model, instructions, userMessage) {
  return postJson('https://api.openai.com/v1/responses', {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  }, JSON.stringify({ model, instructions, input: userMessage, max_output_tokens: 350 }));
}
