import ColorBends from '@/components/HeroAnimSource'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import React from 'react'

const index = () => {
  return (
    <div className='bg-black h-screen w-full mx-auto relative overflow-hidden'>
      <ColorBends
          colors={["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3"]}
          rotation={0}
          speed={0.2}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          parallax={0.5}
          noise={0.1}
        />
      
      {/* Dark Overlay */}
      <div className='absolute inset-0 bg-black/35  z-[5]'></div>

      {/* Header */}
      <header className='absolute top-0 left-0 right-0 z-20 px-6 py-4'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <div className='text-2xl font-semibold'>
            <span>Explainify.</span>
          </div>
          <div className='flex items-center gap-2'>
            <SignedOut>
              <SignUpButton>
                <button className='group text-[14px] px-4 py-[6px] bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl flex flex-row gap-1'>
              Register
              <span className='-mt-[1px] transition-transform duration-200 group-hover:translate-x-[2px]'>
              →
            </span>
            </button>
              </SignUpButton>
              <SignInButton>
                <button className='text-[14px] px-4 py-[6px]  text-white font-medium transition-all duration-200'>
                  Sign In
                </button>
              </SignInButton>
              
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
            
            
            
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <div className='absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10'>
        <div className='max-w-4xl '>
        {/* Badge */}
        <div className='inline-flex items-center px-4 py-1.5 mb-6 rounded-full bg-white/10 backdrop-blur-lg border border-white/20'>
          <span className='text-sm font-medium text-white/90 rainbow-gradient'>
            Turning complexity into clarity
          </span>
        </div>

        {/* Heading */}
        <h1 className='text-5xl md:text-7xl font-semibold text-white mb-6 !leading-tight'>
          Custom Docs. One API. Infinite Audiences.
        </h1>

        {/* Description */}
        <p className='text-lg md:text-xl text-white/70 mb-8 max-w-2xl !leading-normal justify-center text-center mx-auto'>
          Explainify transforms complex API schemas into crystal-clear documentation and engaging podcast summaries - tailored perfectly for any audience.
        </p>

        {/* Buttons */}
        <div className='flex flex-col text-center mx-auto justify-center sm:flex-row gap-4'>
          <Link href="/app">
          <button className='group text-[14px] px-4 py-[6px] bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl flex flex-row gap-1'>
            Get Started
            <span className='-mt-[1px] transition-transform duration-200 group-hover:translate-x-[2px]'>
              →
            </span>
          </button>
          </Link>
          {/* <button className='text-[14px] px-4 py-[6px] text-white font-medium transition-all duration-200'>
            Sign In
          </button> */}
        </div>
        </div>
      </div>
    </div>
  )
}

export default index
