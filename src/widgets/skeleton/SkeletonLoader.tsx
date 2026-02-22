'use client'

import React from 'react'

export function SkeletonLoader() {
  return (
    <div className="space-y-3">
      <div className="h-3 bg-gradient-to-r from-[var(--color-skeleton-from)] to-[var(--color-skeleton-to)] rounded animate-shimmer bg-[length:200%_100%]" />
      <div className="h-3 bg-gradient-to-r from-[var(--color-skeleton-from)] to-[var(--color-skeleton-to)] rounded animate-shimmer bg-[length:200%_100%] w-5/6" />
      <div className="h-3 bg-gradient-to-r from-[var(--color-skeleton-from)] to-[var(--color-skeleton-to)] rounded animate-shimmer bg-[length:200%_100%] w-4/6" />
    </div>
  )
}