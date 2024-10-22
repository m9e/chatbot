import { Sidebar } from '@/components/sidebar'
import { ChatHistory } from '@/components/chat-history'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/kamiwazaApi'

export async function SidebarDesktop() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  let userId = null

  if (token) {
    try {
      const userData = await verifyToken()
      userId = userData?.id
    } catch (error) {
      console.error('Error verifying token:', error)
    }
  }

  if (!userId) {
    return null
  }

  return (
    <Sidebar className="peer absolute inset-y-0 z-30 hidden -translate-x-full border-r bg-muted duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px]">
      <ChatHistory userId={userId} />
    </Sidebar>
  )
}
