import { Sidebar } from '@/components/sidebar'
import { ChatHistory } from '@/components/chat-history'
import { getServerSideToken } from '@/lib/server-utils'

export async function SidebarDesktop() {
  let userId = null
  
  try {
    const token = await getServerSideToken()
    console.log('SidebarDesktop: Token exists:', !!token)

    if (token) {
      const response = await fetch(`${process.env.KAMIWAZA_API_URI}/api/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        console.log('SidebarDesktop: UserData:', userData)
        userId = userData?.id
      }
    }
  } catch (error) {
    console.error('SidebarDesktop: Error:', error)
  }

  if (!userId) {
    console.log('SidebarDesktop: No userId, not rendering sidebar')
    return null
  }

  return (
    <Sidebar className="peer absolute inset-y-0 z-30 hidden -translate-x-full border-r bg-muted duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px]">
      <ChatHistory userId={userId} />
    </Sidebar>
  )
}
