import { SignUp } from '@clerk/react'
import AuthLayout from '../components/auth-layout/auth-layout'

function SignUpPage() {
  return (
    <AuthLayout kind="sign-up">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </AuthLayout>
  )
}

export default SignUpPage
