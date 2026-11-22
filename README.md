# Kai Castro site

A virtual-pet handheld (styled after a starry navy Tamagotchi) with the site inside its LCD.
React + Vite, deployed as a Cloudflare Worker with static assets.

## Develop

    npm install
    npm run dev        # UI only; the booking email needs the Worker (use preview)
    npm run preview    # build + `wrangler dev` (copy .dev.vars.example to .dev.vars first)
    npm test           # Worker tests
    npm run lint

## Controls

The four sections sit on a wheel; the one at the bottom is highlighted (Shows, on load) (shown larger, with
arrows either side that spin the wheel like the device's left / right buttons). Four seconds after the last spin the other three slide off-screen; spinning, or hovering /
tapping the slivers left at the screen's edges, brings them back (`WHEEL_TUCK_MS` in `src/Screen.tsx`). The left and right
buttons spin the wheel, and the middle button opens the highlighted section. Clicking a section
spins it to the bottom (or opens it if it's already there). On an open page, left and right move
a highlight over the back button and links, and the middle button selects it. The pet is
temporarily not selectable (`BUDDY_SELECTABLE` in `src/Screen.tsx`).

The pet's Feed / Bathroom / Sleep / Play actions are still in `src/Screen.tsx` but have no
controls right now; call `nav.current?.('feed')` in `src/App.tsx` to trigger one.

## Deploy (Cloudflare)

1. Create a Turnstile widget in the Cloudflare dashboard for your domain.
2. `npx wrangler secret put TURNSTILE_SECRET` (the widget's secret key).
3. Build with `VITE_TURNSTILE_SITE_KEY` (and `VITE_BANDSINTOWN_APP_ID`) set, e.g. in `.env`.
4. `npm run deploy`.

Security: `public/_headers` sets CSP, HSTS, frame-deny, nosniff, referrer and permissions policy on
every asset. The booking email lives only in the Worker (`BOOKING_EMAIL` in `wrangler.jsonc`) and is
returned from `POST /api/booking-email` only after the Turnstile token verifies.

## Performance notes

- Preact (via `preact/compat`) instead of React: same code, ~12 KB of JS gzipped instead of ~64 KB.
- Animations run on the GPU. To keep it that way: animate only `transform`/`opacity`, keep CSS
  variables out of `@keyframes`, and don't give animations differing `animation-delay`s (in
  Chrome that makes every animation need main-thread frames); put offsets inside the keyframes.
- The LCD palette is drawn with plain colours (`--ink`, `--ink-2`, `--paper` on `.lcd`), not a filter.
- Fonts are subset to what's used (`src/assets/fonts`). To change the logo text, re-subset, e.g.
  `pyftsubset BagelFatOne.woff2 --text="Kai Castro" --flavor=woff2 --output-file=bagel-fat-one-logo.woff2`.
- `/assets/*` is cached for a year (`public/_headers`); file names change whenever content does.
- Show dates are fetched only once Shows is highlighted or opened.

## Art

- The device is pure CSS layers in `src/App.css`: the plain blue shell, a "sky" of sparkles and
  gold stars, moon, streaks and dots (`PIECES` in `src/App.tsx`) that fly out from the center in
  random directions and are clipped to the shell, then the gold bezel, logo, screen and buttons.
- The buddy is a **placeholder**: a CSS blob that shows its pose name (`src/Buddy.tsx`, App.css
  "Buddy"). Give each `[data-pose]` a background image to add real frames; the action sequences
  live in `src/Screen.tsx`.
