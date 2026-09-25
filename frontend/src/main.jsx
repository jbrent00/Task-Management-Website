import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import ClerkWithRouter from './components/clerk-with-router/clerk-with-router.jsx'
import { ThemeProvider } from './components/theme-provider/theme-provider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ClerkWithRouter />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)

