import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'
import { initTheme } from './lib/theme'

// Apply the persisted theme before the first paint to avoid a flash.
initTheme()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
