# Accrualworld

A pixel-art handheld garden sim set on Soil-9, a hostile alien planet where even the air is trying to kill you. Grow mutated plants, brew survival potions, weather meteor showers and acrid fogs, and solve FASB-flavored accounting puzzles to salvage ship parts and launch home.

## Play

The game runs entirely in the browser — no backend, no accounts.

### Controls

| Action | Keyboard | On-screen |
|---|---|---|
| Move cursor | Arrow keys | D-pad |
| A button | `A` / `Z` / `J` | A |
| B button | `B` / `X` / `K` | B |
| Start | `Enter` | START |
| Select | `Shift` | SELECT |
| Tab (codex tabs, expanded status) | `Tab` | — |

- **Garden:** A plants the selected seed / harvests a mature plant. B waters. SELECT cycles seeds. START opens the Colony Console. TAB opens expanded status.
- **Vault puzzles:** UP/DOWN navigate choices (or adjust dial digits in Tier 2). A confirms, B cancels. SELECT scrolls a long scenario.
- **Codex:** LEFT/RIGHT or TAB cycle tabs. UP/DOWN pick an entry. A drills in. B closes.

## Build

Requires Node 18+.

```bash
npm install
npm run dev       # local dev server on http://localhost:5173
npm run build     # production build into ./dist
npm run preview   # serve the production build locally
```

## Deploy to Cloudflare Pages

This is a pure static site, so Pages serves the contents of `dist/` directly.

**One-time setup (via the Cloudflare dashboard):**

1. Pages → *Create a project* → connect this Git repo.
2. Framework preset: **Vite** (or *None*).
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Node version: `22` (set under *Environment variables* as `NODE_VERSION = 22`).

Every push to the configured branch triggers an auto-deploy. PRs get preview deploys at `*.pages.dev` URLs.

**Or via Wrangler (CLI):**

```bash
npm install -g wrangler
npm run build
wrangler pages deploy dist --project-name accrualworld
```

### Optional: social-share image

The HTML references `/og.png` (1200×630) for OpenGraph / Twitter card previews. Drop a screenshot of the game in `public/og.png` and Pages will serve it automatically.

## Tech

- Vite + TypeScript, no game engine
- HTML5 canvas at a logical 160×144 (Game Boy native), integer-scaled
- WebAudio chiptune SFX, procedural — no audio files
- Procedurally-generated bezel grain — no image assets to ship
- LocalStorage for run + meta + settings persistence

## License

Personal project; FASB references are educational. ASC excerpts are paraphrased from publicly available accounting standards.
