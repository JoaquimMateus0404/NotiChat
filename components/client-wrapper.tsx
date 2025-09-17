"use client"

import { useEffect, useState } from 'react'

interface ClientWrapperProps {
  readonly children: React.ReactNode
  readonly fallback?: React.ReactNode
}

export function ClientWrapper({ children, fallback }: ClientWrapperProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return fallback || null
  }

  return <>{children}</>
}
