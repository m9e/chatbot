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
  console.log('ChatPage: Starting with params:', params)
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  console.log('ChatPage: Token:', token?.substring(0, 10) + '...')
  let userData = null
  const missingKeys = await getMissingKeys()

  if (token) {
    try {
      userData = await verifyToken()
      console.log('ChatPage: UserData after verify:', userData)
    } catch (error) {
      console.error('ChatPage: Error verifying token:', error)
    }
  }

  if (!userData) {
    console.log('ChatPage: No userData found')
  }

  const userId = userData?.id || 'anonymous'
  console.log('ChatPage: Using userId:', userId)
  const chat = await getChat(params.id, userId)
  console.log('ChatPage: Retrieved chat:', chat)

  if (!chat || 'error' in chat) {
    console.log('ChatPage: No chat found or error, redirecting to home')
    redirect('/')
  }

  return (
    <AI initialAIState={{ chatId: chat.id, messages: chat.messages, selectedModel: chat.selectedModel }}>
      <Chat
        id={chat.id}
        initialMessages={chat.messages}
        missingKeys={missingKeys}
      />
    </AI>
  )
}
