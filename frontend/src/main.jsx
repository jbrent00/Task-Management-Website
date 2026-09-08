import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import ClerkWithRouter from './components/clerk-with-router/clerk-with-router.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkWithRouter />
    </BrowserRouter>
  </StrictMode>,
)

