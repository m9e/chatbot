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
  const token = cookieStore.get('access_token')?.value
  let userData = null

  if (token) {
    try {
      userData = await verifyToken(token)
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
  const { id } = params
  console.log('ChatPage: Starting with params:', params)

  const cookieStore = cookies()
  const token = cookieStore.get('access_token')?.value
  console.log('ChatPage: Token:', token?.substring(0, 10) + '...')
  let userData = null
  const missingKeys = await getMissingKeys()

  if (token) {
    try {
      userData = await verifyToken(token)
      console.log('ChatPage: UserData after verify:', userData)
    } catch (error) {
      console.error('ChatPage: Error verifying token:', error)
    }
  }

  const userId = userData?.id || 'anonymous'
  const chat = await getChat(id, userId)

  return (
    <AI 
      initialAIState={{
        chatId: id,
        messages: chat?.messages || [],
        selectedModel: chat?.selectedModel ?? undefined
      }}
    >
      <Chat
        id={id}
        initialMessages={chat?.messages || []}
        missingKeys={missingKeys}
      />
    </AI>
  )
}
