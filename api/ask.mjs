import { askOpenAI } from '../server/askOpenAI.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'That request method is not supported.', fix: 'Send a POST request to /api/ask.' } });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!body.message?.trim()) {
      return res.status(400).json({ error: { message: 'Please enter a message.', fix: 'Add a message before asking WellPath AI.' } });
    }

    const answer = await askOpenAI(body.message.trim());
    return res.status(200).json({ answer });
  } catch (error) {
    const fix = error.fix || 'Check the Vercel function logs for details.';
    console.error(fix);
    return res.status(502).json({ error: { message: error.message || 'Something went wrong.', fix } });
  }
}
