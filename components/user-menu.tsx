"use client"

// components/user-menu.tsx

import { type UserData } from '@/lib/kamiwazaApi'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

export interface UserMenuProps {
  user: UserData
}

function getUserInitials(name: string) {
  if (name === 'Anonymous User') {
    return '??'
  }
  const [firstName, lastName] = name.split(' ')
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2)
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    router.push('/login')
  }

  if (!user || user.username === 'Anonymous User') {
    return (
      <Button variant="ghost" className="pl-0" onClick={() => router.push('/login')}>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/50 text-xs font-medium uppercase text-muted-foreground">
          ??
        </div>
        <span className="ml-2 hidden md:block">Log In</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="pl-0">
            <div className="flex size-7 shrink-0 select-none items-center justify-center rounded-full bg-muted/50 text-xs font-medium uppercase text-muted-foreground">
              {getUserInitials(user.full_name || user.username || 'Anonymous User')}
            </div>
            <span className="ml-2 hidden md:block">{user.username}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start" className="w-fit">
          <DropdownMenuItem className="flex-col items-start">
            <div className="text-xs text-zinc-500">{user.email}</div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            Log Out of Kamiwaza
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}