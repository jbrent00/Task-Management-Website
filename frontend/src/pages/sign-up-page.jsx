import { SignUp } from '@clerk/react'

function SignUpPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  )
}

export default SignUpPage