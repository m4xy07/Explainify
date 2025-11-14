![Explainify banner](public/Explainify%20Cropped.png)

# Explainify

Explainify is a Raycast-inspired single-page app that ingests an API specification, lets you target a specific audience, and generates three tailored documentation tracks plus a podcast-style audio summary.

## âœ¨ Feature Highlights

- **Dual JSON inputs** â€” paste raw JSON or drag/drop a `.json` file with inline validation.
- **Role-based focus** â€” Student, Full Stack Developer, Security Researcher, or a custom persona via glowing toggle buttons.
- **AI generation pipeline** â€” POST to `/api/generate` (Google Gemini 1.5 Pro) for three doc versions + a dialogue script.
- **Podcast summaries** â€” pick any of the three doc tracks and `/api/audio` will ask Gemini to craft a Monika/Vikram script, then render it through ElevenLabs + `ffmpeg` (or the bundled binary in Docker).
- **Roadmap flowcharts** — Generate roadmap.sh-style mind maps via `/api/flowchart`, visualised with React Flow to highlight prerequisites, integrations, and optimization paths for each persona.
- **Queries on demand** — Ask Explainify any question about the selected docs/flow; `/api/query` returns concise answers with follow-up prompts.
- **Glassmorphic UI** â€” Tailwind, shadcn/ui primitives, Framer Motion micro-interactions, and Inter typeface for a Basedash/Raycast vibe.
- **Bonus tooling** â€” syntax-highlighted editor, â€œRegenerateâ€ flow, Markdown downloads, Sonner toasts, and mock fallbacks for static demos.

## ðŸ§± Tech Stack

- Next.js 15 (Pages Router) + TypeScript
- Tailwind CSS + shadcn/ui components
- Framer Motion animations
- Codemirror 6 JSON editor + react-dropzone
- Gemini + ElevenLabs integrations (with graceful mock mode)

Explainify now relies on the built-in Next.js API routes for Gemini + ElevenLabs. Run `npm run dev` for local tinkering or `npm run build && npm run start` to serve the production build with those routes available.

## âš™ï¸ Local Development

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

## ðŸ” Environment Variables

Create `.env.local` at the project root and add:

```
GEMINI_API_KEY=ai-...
ELEVENLABS_API_KEY=eleven-...
ELEVENLABS_VOICE_MONIKA=optional_voice_id
ELEVENLABS_VOICE_VIKRAM=optional_voice_id
```

- Leaving keys blank keeps the app in **mock mode** â€” `/api/generate` and `/api/audio` respond instantly with curated sample data and the included `public/audio/mock.mp3`.
- When keys are present and youâ€™re running the Next.js server (`npm run dev` or `npm run start`), Explainify will call the real APIs. The audio route writes to `public/audio/output.mp3`, so be sure that directory is writable (already created by default).

## ðŸ“ Key Paths

| Path | Purpose |
| --- | --- |
| `pages/index.tsx` | Primary interface, wiring JSON input, role selector, doc cards, and audio controls |
| `components/JsonInput.tsx` | Codemirror editor + drag/drop uploader |
| `pages/api/generate.ts` | Google Gemini 1.5 Pro integration with mock fallback |
| `pages/api/audio.ts` | Gemini-powered Monika/Vikram dialogue + ElevenLabs synthesis and ffmpeg concat |
| `pages/api/flowchart.ts` | Gemini roadmap generator feeding the React Flow mind map |
| `pages/api/query.ts` | Gemini Q&A endpoint backing the Questions section |
| `public/audio/mock.mp3` | Sample podcast file used when ElevenLabs keys are absent |

## ðŸš€ Deploying

- **Static hosts (Netlify, GitHub Pages, etc.)** â€” you can still export statically with `next export`, but API routes wonâ€™t be bundled. Keep `mock` mode enabled or wire your own backend.
- **Full-stack hosts (Vercel, Render, etc.)** â€” run `npm run build && npm run start` (or deploy via Vercel) to keep API routes active and let Explainify proxy Gemini/ElevenLabs directly.
- **Docker** â€” build and run locally with:

  ```bash
  docker build -t explainify .
  docker run --rm -p 3000:3000 --env-file .env.local explainify
  ```

  The image installs dependencies, builds the Next.js app, and starts it on port 3000 so it behaves the same as `npm run start`.

## âœ… Next Steps

1. Drop your API keys into `.env.local`.
2. Customize the mock spec in `lib/mock-data.ts` to match your product.
3. Hook the `/api` routes up to your preferred AI providers or swap in serverless functions if youâ€™re targeting a static host.

Turning complexity into clarity is now just one command away. Enjoy!
