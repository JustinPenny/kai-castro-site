import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import VersionToggle from './VersionToggle'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <VersionToggle version="handheld" />
  </StrictMode>,
)
