import fs from 'node:fs/promises';
import https from 'node:https';

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

function readEnvKey() {
  const text = fs.readFile('.env', 'utf8');
  return text.then((contents) => {
    const line = contents.split(/\r?\n/).find((item) => item.startsWith('OPENAI_API_KEY='));
    return line?.slice('OPENAI_API_KEY='.length).trim();
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
  const [apiKey, model, instructions] = await Promise.all([readEnvKey(), readModel(), readInstructions()]);
  if (!apiKey || apiKey === 'paste-your-key-here') throw new Error('missing-key');

  const response = await postJson('https://api.openai.com/v1/responses', {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  }, JSON.stringify({ model, instructions, input: userMessage, max_output_tokens: 350 }));

  if (!response.ok) throw new Error(`openai-${response.status}`);
  const data = await response.json();
  return data.output_text?.trim() || data.output?.flatMap((item) => item.content || []).map((part) => part.text || '').join('').trim() || 'I could not make a helpful answer this time.';
}
