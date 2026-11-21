import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/bagel-fat-one/latin-400.css'
import '@fontsource/silkscreen/latin-400.css'
import '@fontsource/press-start-2p/latin-400.css'
import App from './App'
import './App.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
