'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  IconGitHub,
  IconNextChat,
  IconSeparator,
  IconVercel
} from '@/components/ui/icons'
import { UserMenu } from '@/components/user-menu'
import { SidebarMobile } from './sidebar-mobile'
import { SidebarToggle } from './sidebar-toggle'
import { ChatHistory } from './chat-history'
import { verifyToken, UserData } from '@/lib/kamiwazaApi'
import { useAuth } from '@/lib/auth-context'

function UserOrLogin() {
  const { user, loading } = useAuth()
  const [allowAnonymous, setAllowAnonymous] = useState(false)

  useEffect(() => {
    async function checkAnonymous() {
      const response = await fetch('/api/allow-anonymous')
      const { allowAnonymous } = await response.json()
      setAllowAnonymous(allowAnonymous)
    }
    checkAnonymous()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <>
      {user ? (
        <>
          <SidebarMobile>
            <ChatHistory userId={user.id} />
          </SidebarMobile>
          <SidebarToggle />
          <div className="flex items-center">
            <IconSeparator className="size-6 text-muted-foreground/50" />
            <UserMenu user={user} />
          </div>
        </>
      ) : (
        <div className="flex items-center">
          {allowAnonymous ? (
            <>
              <span className="ml-2">Anonymous User</span>
              <Button variant="link" asChild className="ml-4">
                <Link href="/login">Login to Kamiwaza</Link>
              </Button>
            </>
          ) : (
            <Button variant="link" asChild className="-ml-2">
              <Link href="/login">Login to Kamiwaza</Link>
            </Button>
          )}
        </div>
      )}
    </>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 bg-background">
      <div className="flex items-center">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
        </React.Suspense>
      </div>
      <div className="flex items-center justify-end space-x-2">
        {process.env.NEXT_PUBLIC_KAMIWAZA_URI ? (
          <a href={process.env.NEXT_PUBLIC_KAMIWAZA_URI} target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center">
            <span className="mr-1">→</span> {/* Little arrow added */}
            Kamiwaza Dashboard
          </a>
        ) : null}
      </div>
    </header>
  )
}
