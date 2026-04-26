# Component Parser Workspace

Production-oriented Netlify + React workspace for automated component parsing and footprint-name generation.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Zod validation
- `pdfjs-dist` PDF text extraction in browser
- Netlify Functions API routes
- Local-first persistence via localStorage

## Scripts

```bash
npm install
npm run dev
npm run build
npm run test
```

## Environment variables

Create `.env` locally and configure these in Netlify UI:

- `OPENAI_API_KEY` (optional): enables AI-enhanced parse in `/.netlify/functions/parse`.
- `OPENAI_MODEL` (optional): default `gpt-4.1-mini`.
- `LCSC_API_KEY` (optional)
- `LCSC_API_SECRET` or `LCSC_SIGNATURE_SECRET` (optional)
- `LCSC_API_BASE` (optional, default `https://ips.lcsc.com/rest/wmsc2agent`)
- `JLCPCB_API_KEY` (optional)
- `JLCPCB_API_SECRET` (optional)
- `JLCPCB_API_BASE` (optional)
- `MOCK_LOOKUP_ENABLED=true` (optional dev/demo fallback)

> LCSC signature schemes can vary by account/API docs. Signature helper is isolated in `netlify/functions/_lib/signature.ts`; adjust algorithm if required.

## Netlify deployment

1. Push repo to Git provider.
2. Create Netlify site from repo.
3. Build command: `npm run build`.
4. Publish dir: `dist`.
5. Functions dir: `netlify/functions`.
6. Configure env vars above.

## Architecture workflow

1. User enters required MPN and optional manufacturer, PDF, URL.
2. Browser extracts PDF text with `pdfjs-dist`.
3. Optional manufacturer URL text is fetched server-side.
4. Client calls `parse` function for rule-based parse (AI optional).
5. Client calls `lookup-lcsc-jlc` function for distributor matching.
6. Result is rendered in cards and persisted in localStorage.
7. Workspace can be exported/imported as JSON.

## Notes

- No login required for MVP.
- If `OPENAI_API_KEY` is unavailable, parsing remains functional via local heuristics.
- Mock lookup results are clearly labeled as `MOCK` source.
