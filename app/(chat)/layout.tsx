import { SidebarDesktop } from '@/components/sidebar-desktop'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  console.log('ChatLayout: Rendering');
  return (
    <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden">
      {/* Add debug border to see container */}
      <div className="border-2 border-red-500">
        <SidebarDesktop />
      </div>
      {children}
    </div>
  )
}
