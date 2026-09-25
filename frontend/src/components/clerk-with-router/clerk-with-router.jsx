import { ClerkProvider } from '@clerk/react'
import { useNavigate } from 'react-router-dom'
import App from '../../App.jsx'
import { useTheme } from '../theme-provider/theme-context.js'
import { getClerkAppearance } from './clerk-appearance.js'

function ClerkWithRouter() {
  const navigate = useNavigate()
  const { resolvedTheme } = useTheme()

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/tasks"
      signUpFallbackRedirectUrl="/tasks"
      appearance={getClerkAppearance(resolvedTheme)}
    >
      <App />
    </ClerkProvider>
  )
}

export default ClerkWithRouter
