import { ClerkProvider } from '@clerk/react'
import { useNavigate } from 'react-router-dom'
import App from '../../App.jsx'

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

export default ClerkWithRouter
