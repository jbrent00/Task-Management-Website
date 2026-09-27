import { SignIn } from '@clerk/react'
import AuthLayout from '../components/auth-layout/auth-layout'

function SignInPage() {
  return (
    <AuthLayout kind="sign-in">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </AuthLayout>
  )
}

export default SignInPage
