import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import NotificationCenter from './components/NotificationCenter'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NotificationCenter />
    <App />
  </React.StrictMode>,
)
