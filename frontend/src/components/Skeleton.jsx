import React from 'react'

/**
 * Reusable Cyber Skeleton with gradient shimmer animation
 */
const Skeleton = ({ className = '', rounded = 'rounded-xl', ...props }) => {
  return (
    <div 
      className={`skeleton-shimmer animate-pulse ${rounded} ${className}`}
      {...props}
    />
  )
}

export default Skeleton
