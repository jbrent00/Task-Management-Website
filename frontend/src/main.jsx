import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import ClerkWithRouter from './components/clerk-with-router/clerk-with-router.jsx'
import { ThemeProvider } from './components/theme-provider/theme-provider.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        {window.location.pathname.startsWith('/demo') ? <App /> : <ClerkWithRouter />}
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)

