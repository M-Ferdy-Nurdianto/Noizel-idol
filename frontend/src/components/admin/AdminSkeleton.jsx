import React from 'react'
import Skeleton from '../Skeleton'

const AdminSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col">
      {/* Admin Header Shimmer */}
      <div className="h-16 border-b border-[#272438] bg-[#0E0C15]/90 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-24 h-5 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-20 h-8 rounded-lg" />
        </div>
      </div>

      {/* Admin Body Shimmer */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Sub-header / Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="w-24 sm:w-28 h-10 rounded-xl shrink-0" />
          ))}
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#13121D] border border-[#272438] rounded-2xl p-4 space-y-2">
              <Skeleton className="w-16 h-4 rounded" />
              <Skeleton className="w-24 h-7 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Content Table / Card */}
        <div className="bg-[#13121D] border border-[#272438] rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="w-36 h-6 rounded-lg" />
            <Skeleton className="w-28 h-9 rounded-xl" />
          </div>
          <div className="space-y-3 pt-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-full h-12 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSkeleton
