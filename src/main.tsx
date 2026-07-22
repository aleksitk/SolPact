import { Buffer } from 'buffer'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Several Solana web3 dependencies expect a global Buffer in the browser.
const globalScope = globalThis as typeof globalThis & { Buffer?: typeof Buffer }
if (!globalScope.Buffer) {
  globalScope.Buffer = Buffer
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
