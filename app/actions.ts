'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { kv } from '@vercel/kv'
import { ModelInfo } from '@/lib/types'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/kamiwazaApi'
import { type Chat } from '@/lib/types'

async function getUserData() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null

  try {
    return await verifyToken()
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export async function updateChatWithSelectedModel(chatId: string, selectedModel: ModelInfo) {
  try {
    if (!process.env.KV_URL) {
      console.warn('KV_URL is not defined. Skipping database update.')
      return { success: true, warning: 'Database update skipped' }
    }

    await kv.hset(`chat:${chatId}`, { selectedModel })
    return { success: true }
  } catch (error) {
    console.error('Failed to update chat with selected model:', error)
    return { success: false, error: 'Failed to update chat' }
  }
}

export async function getChats(userId?: string | null) {
  const userData = await getUserData()

  if (!userId || !userData) {
    return []
  }

  if (userId !== userData.id) {
    return {
      error: 'Unauthorized'
    }
  }

  try {
    const pipeline = kv.pipeline()
    const chats: string[] = await kv.zrange(`user:chat:${userId}`, 0, -1, {
      rev: true
    })

    for (const chat of chats) {
      pipeline.hgetall(chat)
    }

    const results = await pipeline.exec()

    return results as Chat[]
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string) {
  const userData = await getUserData()

  if (userId !== userData?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }

  return chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const userData = await getUserData()

  if (!userData) {
    return {
      error: 'Unauthorized'
    }
  }

  // Convert uid to string for consistent comparison with session.user.id
  const uid = String(await kv.hget(`chat:${id}`, 'userId'))

  if (uid !== userData.id) {
    return {
      error: 'Unauthorized'
    }
  }

  await kv.del(`chat:${id}`)
  await kv.zrem(`user:chat:${userData.id}`, `chat:${id}`)

  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats() {
  const userData = await getUserData()

  if (!userData?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chats: string[] = await kv.zrange(`user:chat:${userData.id}`, 0, -1)
  if (!chats.length) {
    return redirect('/')
  }
  const pipeline = kv.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`user:chat:${userData.id}`, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(id: string) {
  const userData = await getUserData()

  if (!userData?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || chat.userId !== userData.id) {
    return {
      error: 'Something went wrong'
    }
  }

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  await kv.hmset(`chat:${chat.id}`, payload)

  return payload
}

export async function saveChat(chat: Chat) {
  const userData = await getUserData()

  if (userData) {
    const pipeline = kv.pipeline()
    pipeline.hmset(`chat:${chat.id}`, chat)
    pipeline.zadd(`user:chat:${chat.userId}`, {
      score: Date.now(),
      member: `chat:${chat.id}`
    })
    await pipeline.exec()
  }
}

export async function refreshHistory(path: string) {
  redirect(path)
}

export async function getMissingKeys() {
  const keysRequired = ['OPENAI_API_KEY']
  return keysRequired
    .map(key => (process.env[key] ? '' : key))
    .filter(key => key !== '')
}
