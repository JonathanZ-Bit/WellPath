# WellPath notes

OpenAI model with “luna” in its name (from `getKey()`): `gpt-5.6-luna`

## How to run

From the WellPath folder, run:

```text
npm start
```

Then open http://127.0.0.1:3000 in a browser.

## Done in Version 1

- Meal logging with real OpenAI encouraging feedback.
- Exercise logging with active-minute totals.
- AI-made weekly meal and movement plan.
- AI question box with friendly safety messaging.
- Server-side API call so the key stays in `.env`.
- The AI key comes from `getKey()` in the server-only `server/getKey.mjs` helper.
- Browser-only saving through `public/storage.js` with sample items.
- `.env` is ignored by Git.
- Saves on this computer only for now.
- Verified in the browser: meal feedback, exercise total, weekly plan, and safe question answer all work with the real AI.

## Maybe Later

- The user can tap I feel faint to get rest and medical help steps.
- The user can answer an age check that asks under-13s for a parent's okay.
- The user can see a week history of meals and workouts.
- The user can set a daily activity goal.
- The user can get a phone reminder to move or drink water.
- The user can mark a planned workout as done.
- The user can ask the AI for a healthy snack idea.
- The user can see a streak count of active days.

## Next

- Test the four MVP flows in the browser and record a short demo video.
- Add a database only when browser-only saving is no longer enough.

## Put online with Vercel

- Import this GitHub repository into Vercel with the default project root.
- Vercel uses `vercel.json` to serve the files in `public/` and runs `api/ask.mjs` as the server function for `POST /api/ask`.
- Leave Build Command and Output Directory blank; no framework preset or build step is needed.
- In Vercel Project Settings → Environment Variables, add `KEYGEN_URL` and `KEYGEN_TOKEN` for every environment that should work (Production, Preview, and/or Development).
- Online, `getKey()` reads only the Vercel environment variables named `KEYGEN_URL` and `KEYGEN_TOKEN`; the OpenAI key is fetched server-side and is never sent to the browser.
- Locally, `npm start` keeps using the ignored `.env` file so the same app can be tested on this computer.
- No other Vercel setting is required. Saving remains in each browser's localStorage.

The local production-style check passed on November 18, 2026: `/` returned 200 and a real `POST /api/ask` request returned an AI answer.
