import { getChats } from '@/app/actions'
import { ClearHistory } from '@/components/clear-history'
import { SidebarItems } from '@/components/sidebar-items'

interface SidebarListProps {
  userId?: string
}

export async function SidebarList({ userId }: SidebarListProps) {
  console.log('SidebarList: Getting chats for userId:', userId)
  const chats = await getChats(userId)
  console.log('SidebarList: Retrieved chats:', chats?.length)

  if (!chats?.length) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No chat history</p>
          </div>
        </div>
        {/* <ClearHistory /> getting rid of this for now cuz its causing issues. */} 
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="space-y-2 px-2">
          <SidebarItems chats={chats} />
        </div>
      </div>
      {/* <ClearHistory /> */}
    </div>
  )
}
