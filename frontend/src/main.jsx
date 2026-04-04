import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import { BrowserRouter, useNavigate } from 'react-router-dom';
import './index.css'
import App from './App.jsx'

function ClerkWithRouter() {
  const navigate = useNavigate()

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/tasks"
      signUpFallbackRedirectUrl="/tasks"
    >
      <App />
    </ClerkProvider>
  )
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkWithRouter />
    </BrowserRouter>
  </StrictMode>,
)

   

