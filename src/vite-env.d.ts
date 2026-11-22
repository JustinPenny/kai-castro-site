/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Bandsintown "Artist API Key" -- see src/bandsintown.ts for where this is
  // used and how to get one.
  readonly VITE_BANDSINTOWN_APP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
