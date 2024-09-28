'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { whoami } from '@/utils/kamiwazaApi'

export default function KamiwazaAuthCheck() {
  const router = useRouter()

  useEffect(() => {
    const checkKamiwazaAuth = async () => {
      try {
        const userData = await whoami()
        if (userData) {
          router.push('/')
        }
      } catch (error) {
        console.error('Error checking Kamiwaza authentication:', error)
      }
    }

    checkKamiwazaAuth()
  }, [router])

  return null // This component doesn't render anything
}