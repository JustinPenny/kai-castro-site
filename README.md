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

The three buttons work like the toy: **A** cycles the menu icons, **B** runs the selected one,
**C** goes back. Icons and corner labels can also be clicked; clicking the buddy opens Status.

## Deploy (Cloudflare)

1. Create a Turnstile widget in the Cloudflare dashboard for your domain.
2. `npx wrangler secret put TURNSTILE_SECRET` (the widget's secret key).
3. Build with `VITE_TURNSTILE_SITE_KEY` (and `VITE_BANDSINTOWN_APP_ID`) set, e.g. in `.env`.
4. `npm run deploy`.

Security: `public/_headers` sets CSP, HSTS, frame-deny, nosniff, referrer and permissions policy on
every asset. The booking email lives only in the Worker (`BOOKING_EMAIL` in `wrangler.jsonc`) and is
returned from `POST /api/booking-email` only after the Turnstile token verifies.

## Art

- The device is pure CSS layers in `src/App.css`: the plain blue shell, a "sky" of sparkles and
  gold stars, moon, streaks and dots (`PIECES` in `src/App.tsx`) that fly out from the center in
  random directions and are clipped to the shell, then the gold bezel, logo, screen and buttons.
- The buddy is a **placeholder**: a CSS blob that shows its pose name (`src/Buddy.tsx`, App.css
  "Buddy"). Give each `[data-pose]` a background image to add real frames; the action sequences
  live in `src/Screen.tsx`.
