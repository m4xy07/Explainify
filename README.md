![Explainify banner](public/file.svg)

# Explainify

Check it out live @ https://explainify.dev

## ⚙️ Local Development

```bash
# install deps
npm install

# run the SPA
npm run dev

# lint with the project rules
npm run lint

# production build
npm run build && npm run start
```

Visit `http://localhost:3000` to use Explainify. The UI ships with a seeded mock spec so you can try the full experience without wiring real providers.

## 🔐 Environment Variables

Create `.env.local` at the project root and add:

```
GEMINI_API_KEY=ai-...
ELEVENLABS_API_KEY=eleven-...
ELEVENLABS_VOICE_ALEX=optional_voice_id
ELEVENLABS_VOICE_JAMIE=optional_voice_id
```

- Leaving keys blank keeps the app in **mock mode** — `/api/generate` and `/api/audio` respond instantly with curated sample data and the included `public/audio/mock.mp3`.
- When keys are present and you’re running the Next.js server (`npm run dev` or `npm run start`), Explainify will call the real APIs. The audio route writes to `public/audio/output.mp3`, so be sure that directory is writable (already created by default).

## 📁 Key Paths

| Path | Purpose |
| --- | --- |
| `pages/index.tsx` | Primary interface, wiring JSON input, role selector, doc cards, and audio controls |
| `components/JsonInput.tsx` | Codemirror editor + drag/drop uploader |
| `pages/api/generate.ts` | Google Gemini 1.5 Pro integration with mock fallback |
| `pages/api/audio.ts` | Gemini-powered dialogue creation + ElevenLabs synthesis and ffmpeg concat |
| `public/audio/mock.mp3` | Sample podcast file used when ElevenLabs keys are absent |

## 🚀 Deploying

- **Static hosts (Netlify, GitHub Pages, etc.)** — you can still export statically with `next export`, but API routes won’t be bundled. Keep `mock` mode enabled or wire your own backend.
- **Full-stack hosts (Vercel, Render, etc.)** — run `npm run build && npm run start` (or deploy via Vercel) to keep API routes active and let Explainify proxy Gemini/ElevenLabs directly.


Turning complexity into clarity is now just one command away. Enjoy!
