# Kai Castro site

A virtual-pet handheld (styled after a starry navy Tamagotchi) with the site inside its LCD.
Preact + Vite, hosted on AWS Amplify.

## Develop

    npm install
    npm run dev        # local dev server
    npm run build      # production build into dist/
    npm run preview    # serve dist/ locally
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

## Deploy (AWS Amplify)

Merging into `main` triggers an Amplify build (`npm run build`, output `dist/`). Set
`VITE_BANDSINTOWN_APP_ID` under the app's environment variables in the Amplify console.

Security and caching headers live in `customHttp.yml` (CSP, HSTS, frame-deny, nosniff, referrer and
permissions policy; a year of caching for `/assets/*`). Headers in that file override any set in
the Amplify console. Check them after a deploy with `curl -I https://<your-domain>/`.

## Performance notes

- Preact (via `preact/compat`) instead of React: same code, ~12 KB of JS gzipped instead of ~64 KB.
- Animations run on the GPU. To keep it that way: animate only `transform`/`opacity`, keep CSS
  variables out of `@keyframes`, and don't give animations differing `animation-delay`s (in
  Chrome that makes every animation need main-thread frames); put offsets inside the keyframes.
- The LCD palette is drawn with plain colours (`--ink`, `--ink-2`, `--paper` on `.lcd`), not a filter.
- Fonts are subset to what's used (`src/assets/fonts`). To change the logo text, re-subset, e.g.
  `pyftsubset BagelFatOne.woff2 --text="Kai Castro" --flavor=woff2 --output-file=bagel-fat-one-logo.woff2`.
- `/assets/*` is cached for a year (`customHttp.yml`); file names change whenever content does.
- Show dates are fetched only once Shows is highlighted or opened.

## Art

- The device is pure CSS layers in `src/App.css`: the plain blue shell, a "sky" of sparkles and
  gold stars, moon, streaks and dots (`PIECES` in `src/App.tsx`) that fly out from the center in
  random directions and are clipped to the shell, then the gold bezel, logo, screen and buttons.
- The buddy is a **placeholder**: a CSS blob that shows its pose name (`src/Buddy.tsx`, App.css
  "Buddy"). Give each `[data-pose]` a background image to add real frames; the action sequences
  live in `src/Screen.tsx`.
