import React from 'react'
import Skeleton from './Skeleton'

/**
 * PageSkeleton
 * Full-page shimmer skeleton shown during route transitions (Suspense fallback)
 * and initial page loading to prevent layout shifts or blank screens.
 */
const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#09090B] text-white relative overflow-hidden">
      {/* Ambient Cyber Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#9D26FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-[#24C6F5]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Placeholder */}
      <header className="sticky top-0 z-40 w-full h-20 bg-[#09090B]/80 backdrop-blur-md border-b border-[#272438] px-4 sm:px-8 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-24 h-6 rounded-lg hidden sm:block" />
        </div>

        {/* Center: Nav Links */}
        <div className="hidden md:flex items-center gap-2">
          <Skeleton className="w-16 h-8 rounded-full" />
          <Skeleton className="w-20 h-8 rounded-full" />
          <Skeleton className="w-20 h-8 rounded-full" />
          <Skeleton className="w-20 h-8 rounded-full" />
          <Skeleton className="w-16 h-8 rounded-full" />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-28 h-9 rounded-xl hidden sm:block" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto max-w-6xl px-4 pt-12 sm:pt-16 pb-20 relative z-10 space-y-16">
        
        {/* Hero Section Placeholder */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="flex justify-center">
            <Skeleton className="w-32 h-6 rounded-full" />
          </div>
          <div className="flex justify-center">
            <Skeleton className="w-4/5 sm:w-2/3 h-12 sm:h-16 rounded-2xl" />
          </div>
          <div className="space-y-2 pt-1 flex flex-col items-center">
            <Skeleton className="w-5/6 sm:w-3/4 h-4 rounded-lg" />
            <Skeleton className="w-2/3 sm:w-1/2 h-4 rounded-lg" />
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <Skeleton className="w-36 h-11 rounded-xl" />
            <Skeleton className="w-32 h-11 rounded-xl" />
          </div>
        </div>

        {/* Cards Section Placeholder */}
        <div className="space-y-6 pt-4">
          {/* Section Sub-header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#272438] pb-4">
            <div className="space-y-2">
              <Skeleton className="w-28 h-5 rounded-md" />
              <Skeleton className="w-48 h-8 rounded-xl" />
            </div>
            <Skeleton className="w-32 h-8 rounded-xl" />
          </div>

          {/* Cards 3-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((cardId) => (
              <div 
                key={cardId} 
                className="bg-[#13121D] rounded-3xl border border-[#272438] p-5 space-y-4 shadow-xl"
              >
                {/* Media Aspect Box */}
                <Skeleton className="w-full aspect-[4/3] rounded-2xl" />

                {/* Tags row */}
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="w-20 h-5 rounded-full" />
                  <Skeleton className="w-16 h-4 rounded-md" />
                </div>

                {/* Card Title & Description */}
                <div className="space-y-2">
                  <Skeleton className="w-4/5 h-6 rounded-lg" />
                  <Skeleton className="w-full h-4 rounded-md" />
                  <Skeleton className="w-2/3 h-4 rounded-md" />
                </div>

                {/* Card Action Button */}
                <div className="pt-2">
                  <Skeleton className="w-full h-11 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}

export default PageSkeleton
