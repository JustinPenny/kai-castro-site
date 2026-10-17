import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import VersionToggle from '../VersionToggle'

// The original site lives on its own page (/original.html) so its global CSS
// never mixes with the handheld's.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <VersionToggle version="original" />
  </StrictMode>,
)
