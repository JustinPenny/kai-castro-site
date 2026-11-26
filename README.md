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
a highlight over the back button and links, and the middle button selects it. The keyboard's
left / right arrow keys and sideways swipes work like the left / right buttons (a swipe left brings
the next option in).

Clicking the pet flips the wheel's boxes over like cards: its actions (Feed, Sleep, Potty, Play)
are on their backs, driven the same way. For now, clicking the pet again flips them back.

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
- Buddy's frames are switched with `transform` on the sprite sheet, not `background-position`
  (which restyles every frame on the main thread: ~140 ms/s on a throttled phone).
- The LCD palette is drawn with plain colours (`--ink`, `--ink-2`, `--paper` on `.lcd`), not a filter.
- The only font file is the LCD's pixel font (`src/assets/fonts`); the logo is an SVG.
- `/assets/*` is cached for a year (`customHttp.yml`); file names change whenever content does.
- Show dates are fetched only once Shows is highlighted or opened.

## Art

- `src/assets/kai-castro-wordmark.svg` is the KAI CASTRO wordmark, redrawn as vector strokes from the
  poster artwork (the O is the bird logo). It's shown through a CSS mask, so its colour comes from CSS.

- The device is pure CSS layers in `src/App.css`: the plain blue shell, a "sky" of sparkles and
  gold stars, moon, streaks and dots (`PIECES` in `src/App.tsx`) that fly out from the center in
  random directions and are clipped to the shell, then the gold bezel, logo, screen and buttons.
- The buddy is pixel art: all 18 frames in one sprite sheet (`src/assets/buddy-sheet.webp`, 128px
  frames with 8px gaps). App.css ("Buddy") picks a frame per `[data-pose]`; the action sequences
  live in `src/Screen.tsx`.
