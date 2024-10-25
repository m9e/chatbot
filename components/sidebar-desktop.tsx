import { Sidebar } from '@/components/sidebar'
import { ChatHistory } from '@/components/chat-history'
import { verifyToken } from '@/lib/kamiwazaApi'
import { getServerSideToken } from '@/lib/server-utils'

export async function SidebarDesktop() {
  try {
    const token = await getServerSideToken()
    console.log('SidebarDesktop: Token exists:', !!token)

    if (!token) {
      console.log('SidebarDesktop: No token found')
      return null
    }

    const userData = await verifyToken(token)
    console.log('SidebarDesktop: UserData:', userData)

    if (!userData?.id) {  // Using sub instead of id as that's what Kamiwaza returns
      console.log('SidebarDesktop: No user data found')
      return null
    }

    return (
      <Sidebar className="peer absolute inset-y-0 z-30 hidden -translate-x-full border-r bg-muted duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px]">
        <ChatHistory userId={userData.id} />
      </Sidebar>
    )
  } catch (error) {
    console.error('SidebarDesktop: Error:', error)
    return null
  }
}
