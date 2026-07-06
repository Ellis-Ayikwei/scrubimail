# ScrubiMail Design System

A brand & UI system for **ScrubiMail** — an email-validation SaaS (API + dashboards) that
validates single emails in real time and processes bulk lists to cut bounce rates and protect
sender reputation. Tagline: **"Emails flowing safely into inboxes."**

This project is the compiled design system that consuming projects link to build new
ScrubiMail screens, marketing pages, decks, and prototypes on-brand.

## ⚡ The rebrand: v2 "Surgical Infrastructure" is now the whole product

ScrubiMail has **completed a full rebrand**. The new aesthetic ships across **both** the marketing
site *and* the signed-in app — there is no longer a friendly-teal surface in production.

- **v2 — "Surgical Infrastructure"** (current, product-wide). Terminal-engineering look:
  **Epilogue** black display, **Space Grotesk** mono-labels, **JetBrains Mono** metrics, **Inter**
  body; **emerald `#10B981` → mint `#6effc0`** accent; near-black terminal canvas; **sharp 2px
  corners**; glass panels, line-numbered code blocks, surgical-line hairlines, snake_Case copy.
  → Tokens in `tokens/infra.css`; recreations in `ui_kits/marketing/` **and** `ui_kits/app/`;
  cards tagged "(v2)".
- **v1 — "Friendly SaaS"** (LEGACY). Charlie font, teal `#2ED8A3`, fully-rounded pills, soft
  shadows. Retained only for reference / migration — **do not start new work here.** The reusable
  primitives in `components/` still carry v1 styling and are pending a v2 restyle.

**For any new ScrubiMail surface — marketing or in-product — use v2.**

## Sources

Everything here was reverse-engineered from the product's own code — colors, fonts, components,
and copy are lifted from the live frontend, not invented.

- **GitHub monorepo:** [`Ellis-Ayikwei/scrubimail`](https://github.com/Ellis-Ayikwei/scrubimail)
  - `Scrubimail-FE/` — user dashboard (React + Vite + Tailwind). Primary source of truth.
    - `tailwind.config.cjs` — the color scales, font family, shadows.
    - `src/components/` — `HeroSection`, `FeaturesSection`, `Footer`, plus a large hand-rolled
      `Icon/` set; the app uses **lucide-react** for most screen icons. The current public homepage
      lives in `src/pages/Homepage.tsx` (the v2 "Surgical Infrastructure" redesign) with its nav in
      `src/components/TopBar.tsx` — both source the Epilogue/mint terminal aesthetic.
    - `src/pages/` — `Dashboard`, `Validation/`, `Pricing`, `BulkUpload`, `ApiDocs`, `Billing`, etc.
    - `public/assets/fonts/charlie-*` — the brand's "Charlie" webfonts.
  - `Scrubimail-Admin-FE/` — admin dashboard (not yet mirrored here).
  - `ScrubiMail-BE/` — Django REST API (`POST /scrubimail/api/v1/validate/`).

> Explore the repo further to deepen any recreation — the real screens (`Profile`, `Analytics`,
> `History`, `Integrations`, `Onboarding`) hold more patterns than are mirrored here.

⚠️ **Font note:** "Charlie" (Charlie Display + Charlie Text) is the configured brand face and is
shipped in `assets/fonts/`. It is a proprietary face; if you need a license-safe substitute, the
product also loads **Nunito** (Google Fonts) as its fallback — it is wired into `styles.css` and
is the closest open match. Flag to the brand owner if redistribution is a concern.

---

## Content fundamentals — how ScrubiMail writes

- **Voice:** confident, technical, developer-facing but plain-spoken. It sells precision and speed,
  not hype. "Validate email addresses with professional precision."
- **Person:** addresses the reader as **you / your** ("your messages", "your sender reputation").
  The product speaks in first-person plural about itself ("Our advanced API…").
- **Casing:** **sentence case** everywhere — headlines, buttons, nav. Never ALL-CAPS except the
  small mono eyebrow labels ("PLATFORM", "API-FIRST").
- **Headlines** are short and declarative, often a benefit: *"Emails flowing safely into inboxes."*
  *"Built for modern applications."* *"One call. A complete verdict."*
- **Numbers are proof.** Copy leans on concrete metrics: *Sub-300ms response*, *99.9% accuracy*,
  *<300ms*, *99.9% uptime SLA*, *10K+ developers*. Use real-feeling figures, not vague claims.
- **Feature names** are 2–3 words, sentence case: "Real-time validation", "Advanced fraud
  detection", "Developer-first API", "Bulk processing".
- **CTAs** are action + outcome: "Start validating for free", "Get started", "Try it free →",
  "View documentation". A trailing arrow (→) is common on text links.
- **No emoji** in product UI or marketing copy. Iconography carries that load (lucide line icons).
- **Status language** is binary and clear: Valid / Invalid, Completed / Failed / Pending,
  Yes / No in breakdown rows.

---

## Visual foundations

**Color.** The brand is **teal-forward** — `#2ED8A3` (with `#00C48C` as the active/hover step) is
the signature and carries nearly every CTA, active state, icon accent, and metric. The marketing
hero shifts a half-step greener to an **emerald gradient** `#10B981 → #059669`. Supporting accents
are used only as *category* colors on dashboard tiles: navy `#004E8A`, violet `#8B5CF6`, amber
`#F59E0B`, info blue `#2196F3`. Status: success `#00C48C`, danger `#FF4C4C`, warning `#F59E0B`.
Neutrals are warm-gray (body `#2D2D2D`, secondary `#6D6D6D`). **Don't introduce new accent hues** —
teal + one category color per tile is the whole palette.

**Dark mode is first-class.** The product ships a **GitHub-inspired dark canvas**: bg `#0d1117`,
surface `#161b22`, inset `#21262d`, border `#30363d`, muted text `#7d8590`. Toggled via `.dark` on
`<html>`. In dark mode the primary shifts to emerald `#10B981`. All tokens have dark equivalents.

**Type.** **Charlie Display** for headings & the wordmark (weights to 700, sentence case, slightly
tight tracking ~−2%); **Charlie Text** for body; **Nunito** is the loaded fallback. Mono
(JetBrains Mono) only for code, API keys, and over-line eyebrow labels. Display ceiling is 700.

**Shape & rounding.** The brand **leans round**. Buttons, tabs, badges, status chips, and credit
pills are **fully rounded** (`9999px`). Cards are `12–16px`; hero containers `24px`. Inputs `8–10px`.
This generous rounding is the most recognizable structural trait.

**Backgrounds.** Light surfaces sit on near-white `#f9f9f9`. The hero uses a **faint dot/line grid**
masked with a radial fade, plus **floating rounded icon chips** (Mail, Shield, CheckCircle…) that
gently bob (`float` keyframes, 3–7s ease-in-out) and a soft **teal glow** blurred behind the product
shot. Section rhythm alternates light → a **polarity-flipped dark band** (`#0d1117`) for the
API/terminal moment → light again. No photography; the product screenshot is the hero image.

**Elevation.** Soft and low — `shadow-sm/md` for cards (subtle, never heavy). Emphasis uses a
**teal glow ring** (`0 0 0 4px rgba(46,216,163,.12)`) rather than a darker drop. The CTA can use a
warm `urgent` orange glow. Cards = white/dark surface + 1px hairline border + soft shadow.

**Motion & states.** Calm. `200ms` standard ease (`cubic-bezier(.4,0,.2,1)`). Hover lifts cards
with a teal border + slightly stronger shadow; buttons darken to the hover teal and **press shrinks**
to `scale(0.97)`. Inputs focus to a teal border + glow ring. Spinners for loading. Respect
`prefers-reduced-motion`.

**Transparency/blur.** Sticky nav uses an 80%-opacity surface with `backdrop-filter: blur(12px)`.
Floating hero chips are translucent (`color + 22` fill, `+55` border) with a light blur.

**Layout.** 4px base unit; content max-width ~1200px with 24px gutters; 64px header. Feature grids
are 3-up (then 2-up, 1-up). Dashboard stats are 4-up tiles. Pricing is 3-up with the middle tier
polarity-flipped dark.

---

## Iconography

- **Primary system: [Lucide](https://lucide.dev)** — the live app imports `lucide-react` throughout
  (Mail, Shield, CheckCircle, XCircle, Zap, Code, BarChart3, Activity, ArrowRight, Upload, Key,
  History, Globe, Database, Clock, TrendingUp/Down, RefreshCw, Eye…). Stroke width 2, round caps
  and joins. The repo also contains a large hand-rolled `src/components/Icon/` set, but lucide is
  what renders on the marketing + dashboard surfaces.
- **In this system:** `ui_kits/icons.jsx` provides a compact, dependency-free set of lucide-style
  icons (same geometry, `stroke-width:2`, round caps) used by the UI kits. For production work,
  prefer real `lucide-react`. When you need an icon not in `icons.jsx`, copy the matching Lucide
  SVG rather than drawing your own.
- **Icon chips:** icons frequently sit in a rounded square tile (10–18px radius) filled with a soft
  tint of their accent color, or reversed (white icon on a solid brand tile).
- **No emoji**, no unicode-glyph icons in product chrome. Status uses small colored **dots**
  (8px circle, green/red) next to text.
- **Logo / mark:** the wordmark is "Scrubi" (ink) + "Mail" (teal) beside a **circle-with-two-slashes**
  glyph — the "scrub" gesture. White variant for dark surfaces. See `assets/` and the Brand cards.

---

## Index / manifest

**Root**
- `styles.css` — the entry point consumers link (`@import` manifest only).
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skills-compatible usage instructions.

**`tokens/`** (all reachable from `styles.css`)
- `fonts.css` — `@font-face` for Charlie Display / Charlie Text.
- `colors.css` — base palettes + semantic aliases (light).
- `dark.css` — `.dark` semantic overrides (GitHub dark canvas).
- `typography.css` — families, scale, weights, tracking.
- `spacing.css` — spacing, radius, shadow, motion, layout tokens.
- `infra.css` — **v2 "Surgical Infrastructure"** tokens: Epilogue/Space Grotesk/Inter fonts,
  emerald→mint accent, terminal dark canvas, sharp 2px radius, label-tracking presets.
- `base.css` — optional light reset (body/heading/link defaults).

**`assets/`**
- `scrubimail-logo.png` / `-white.png` — full wordmark (light / dark).
- `scrubimail-mark.png` / `-white.png` — glyph only.
- `product-validation.png` — product screenshot (hero image).
- `fonts/charlie-*.ttf` — brand webfonts.

**`components/`** — reusable React primitives (compiled into the bundle)
- `core/` — **Button**, **Badge**, **Card**
- `forms/` — **Input**
- `dashboard/` — **StatCard**, **ProgressBar**
- `navigation/` — **SegmentedTabs**

**`guidelines/`** — foundation specimen cards (Design System tab): Colors, Type, Spacing, Brand.

**`ui_kits/`** — full-screen product recreations
- `icons.jsx` — shared lucide-style icon set.
- `marketing/` — **v2 "Surgical Infrastructure" homepage** (terminal hero, stats band, capabilities
  bento, scan-process, capacity-matrix pricing, CTA, footer). Theme-aware, **dark-first**; split into
  `infra-shared / infra-hero / infra-features / infra-pricing` + `index.html`.
- `app/` — **v2** in-product app: terminal **Sidebar** + **TopBar**, redesigned **Dashboard**
  (stats, System Operations, Live Log Stream, API Health, Infrastructure Status) and a terminal
  **Validate** probe flow. Theme-aware, dark-first; `shell / dashboard / validate` + `index.html`.

### Using a component
```jsx
// In a card / kit HTML, after loading _ds_bundle.js:
const { Button, StatCard } = window.ScrubiMailDesignSystem_aadbe2;
<Button variant="primary" pill>Start validating</Button>
```

### v2 font + accent quick-start (Surgical Infrastructure)
```css
/* headings */  font-family: var(--font-headline); /* Epilogue 900, letter-spacing:-.04em */
/* labels   */  font-family: var(--font-label);    /* Space Grotesk, UPPER, tracking .1–.3em */
/* metrics  */  font-family: var(--font-mono);     /* JetBrains Mono */
/* body     */  font-family: var(--font-body);     /* Inter 300/400 */
/* accent   */  --emerald (#10B981) on light · --mint (#6effc0) + --mint-ink (#003824) on dark
/* corners  */  border-radius: var(--radius-xs);   /* 2px — sharp, NOT pills */
```
