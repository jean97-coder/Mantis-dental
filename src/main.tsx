import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const nativeFetch = window.fetch.bind(window)
window.fetch = (input, init = {}) => {
  const token = localStorage.getItem('mantis-session')
  if (!token) return nativeFetch(input, init)
  try {
    const session = JSON.parse(token) as { token?: string }
    const headers = new Headers(init.headers)
    if (session.token) headers.set('Authorization', `Bearer ${session.token}`)
    return nativeFetch(input, { ...init, headers })
  } catch {
    return nativeFetch(input, init)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
