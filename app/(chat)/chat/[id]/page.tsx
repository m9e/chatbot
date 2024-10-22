import { type Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getChat, getMissingKeys } from '@/app/actions'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { verifyToken } from '@/lib/kamiwazaApi'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params
}: ChatPageProps): Promise<Metadata> {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  let userData = null

  if (token) {
    try {
      userData = await verifyToken()
    } catch (error) {
      console.error('Error verifying token:', error)
      return {}
    }
  }

  if (!userData) {
    return {}
  }

  const chat = await getChat(params.id, userData.id)

  if (!chat || 'error' in chat) {
    redirect('/')
  } else {
    return {
      title: chat?.title.toString().slice(0, 50) ?? 'Chat'
    }
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  let userData = null
  const missingKeys = await getMissingKeys()

  if (token) {
    try {
      userData = await verifyToken()
    } catch (error) {
      console.error('Error verifying token:', error)
    }
  }

  if (!userData && !process.env.ALLOW_ANONYMOUS) {
    redirect(`/login?next=/chat/${params.id}`)
  }

  const userId = userData?.id || 'anonymous'
  const chat = await getChat(params.id, userId)

  if (!chat || 'error' in chat) {
    if (userData) { // If user is logged in but can't access the chat
      redirect('/')
    }
  } else {
    if (chat?.userId !== userId) {
      notFound()
    }

    return (
      <AI initialAIState={{ chatId: chat.id, messages: chat.messages }}>
        <Chat
          id={chat.id}
          initialMessages={chat.messages}
          missingKeys={missingKeys}
        />
      </AI>
    )
  }
}
