import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import VersionToggle, { type Version } from './VersionToggle'

// Demo toggle: the new handheld version is the default; `?version=original`
// shows the original site. Only the chosen version (and its CSS) is loaded.
const version: Version =
  new URLSearchParams(window.location.search).get('version') === 'original' ? 'original' : 'handheld'

async function start() {
  if (version === 'original') {
    await import('./original/index.css')
  } else {
    await import('./index.css')
  }
  const { default: App } = await (version === 'original'
    ? import('./original/App.tsx')
    : import('./App.tsx'))

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
      <VersionToggle version={version} />
    </StrictMode>,
  )
}

void start()
