import { SignIn } from '@clerk/nextjs'
import React from 'react'

export const dynamic = 'force-dynamic'

const SignInPage = () => {
  return (
    <main className='flex h-screen w-full items-center justify-center font-inter bg-black'>
      <SignIn />
    </main>    
  )
}

export default SignInPage
