'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ModelInfo } from '@/lib/types'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/kamiwazaApi'
import { type Chat } from '@/lib/types'
import { redis } from '@/lib/redis'

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

    await redis.hset(`chat:${chatId}`, { selectedModel })
    return { success: true }
  } catch (error) {
    console.error('Failed to update chat with selected model:', error)
    return { success: false, error: 'Failed to update chat' }
  }
}

export async function getChats(userId?: string | null) {
  console.log('getChats: Starting for userId:', userId)
  const userData = await getUserData()

  if (!userId || !userData) {
    return []
  }

  if (userId !== userData.id) {
    return { error: 'Unauthorized' }
  }

  try {
    // Get chat IDs from sorted set
    const chatIds = await redis.zrange(`user:chat:${userId}`, 0, -1, 'REV')
    console.log('getChats: Found chat IDs:', chatIds)

    if (!chatIds.length) return []

    // Get all chats data
    const pipeline = redis.pipeline()
    for (const chatId of chatIds) {
      pipeline.hgetall(chatId)
    }

    const results = await pipeline.exec()
    const chats = results
      ?.map(([err, data]) => {
        if (err || !data) return null
        return {
          ...data,
          messages: JSON.parse(data.messages || '[]'),
          createdAt: new Date(data.createdAt),
          selectedModel: data.selectedModel ? JSON.parse(data.selectedModel) : null
        }
      })
      .filter(Boolean) as Chat[]

    return chats
  } catch (error) {
    console.error('getChats: Error:', error)
    return []
  }
}

export async function getChat(id: string, userId: string) {
  console.log('getChat: Starting with id:', id, 'userId:', userId)
  
  try {
    // Get chat data as a hash
    const exists = await redis.exists(`chat:${id}`)
    console.log('getChat: Chat exists?', exists)
    
    const chatData = await redis.hgetall(`chat:${id}`)
    console.log('getChat: Raw chat data:', chatData)

    if (!chatData || Object.keys(chatData).length === 0) {
      // List all keys to debug
      const allKeys = await redis.keys('chat:*')
      console.log('getChat: All chat keys:', allKeys)
      console.log('getChat: No chat found')
      return null
    }

    // Parse stored JSON fields
    const chat: Chat = {
      ...chatData,
      messages: JSON.parse(chatData.messages || '[]'),
      createdAt: new Date(chatData.createdAt),
      selectedModel: chatData.selectedModel ? JSON.parse(chatData.selectedModel) : null
    }
    console.log('getChat: Parsed chat:', chat)

    return chat
  } catch (error) {
    console.error('getChat: Error:', error)
    return null
  }
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const userData = await getUserData()

  if (!userData) {
    return {
      error: 'Unauthorized'
    }
  }

  // Get userId from Redis hash
  const uid = await redis.hget(`chat:${id}`, 'userId')

  if (uid !== userData.id) {
    return {
      error: 'Unauthorized'
    }
  }

  // Use pipeline for atomic operations
  const pipeline = redis.pipeline()
  pipeline.del(`chat:${id}`)
  pipeline.zrem(`user:chat:${userData.id}`, `chat:${id}`)
  await pipeline.exec()

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

  const chats: string[] = await redis.zrange(`user:chat:${userData.id}`, 0, -1)
  if (!chats.length) {
    return redirect('/')
  }

  const pipeline = redis.pipeline()
  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`user:chat:${userData.id}`, chat)
  }
  await pipeline.exec()

  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {
  try {
    const chatData = await redis.hgetall(`chat:${id}`)
    
    if (!chatData || !chatData.sharePath) {
      return null
    }

    // Parse stored JSON fields
    const chat: Chat = {
      ...chatData,
      messages: JSON.parse(chatData.messages || '[]'),
      createdAt: new Date(chatData.createdAt),
      selectedModel: chatData.selectedModel ? JSON.parse(chatData.selectedModel) : null
    }

    return chat
  } catch (error) {
    console.error('getSharedChat: Error:', error)
    return null
  }
}

export async function shareChat(id: string) {
  const userData = await getUserData()

  if (!userData?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  try {
    const chatData = await redis.hgetall(`chat:${id}`)
    if (!chatData || chatData.userId !== userData.id) {
      return {
        error: 'Something went wrong'
      }
    }

    // Parse stored JSON fields
    const chat: Chat = {
      ...chatData,
      messages: JSON.parse(chatData.messages || '[]'),
      createdAt: new Date(chatData.createdAt),
      selectedModel: chatData.selectedModel ? JSON.parse(chatData.selectedModel) : null
    }

    const payload = {
      ...chat,
      sharePath: `/share/${chat.id}`
    }

    // Prepare data for Redis storage
    const saveData = {
      ...payload,
      messages: JSON.stringify(payload.messages),
      createdAt: payload.createdAt.toISOString(),
      selectedModel: JSON.stringify(payload.selectedModel)
    }

    await redis.hmset(`chat:${chat.id}`, saveData)
    return payload
  } catch (error) {
    console.error('shareChat: Error:', error)
    return {
      error: 'Something went wrong'
    }
  }
}

export async function saveChat(chat: Chat) {
  console.log('saveChat: Starting with chat ID:', chat.id)
  
  if (!chat.id) {
    console.error('saveChat: No chat ID provided')
    return false
  }

  const chatKey = `chat:${chat.id}`
  console.log('saveChat: Using Redis key:', chatKey)

  try {
    const chatData = {
      ...chat,
      messages: JSON.stringify(chat.messages),
      createdAt: chat.createdAt.toISOString(),
      selectedModel: JSON.stringify(chat.selectedModel)
    }

    await redis.hmset(chatKey, chatData)
    console.log('saveChat: Successfully saved chat with ID:', chat.id)
    return true
  } catch (error) {
    console.error('saveChat: Error saving chat:', error)
    return false
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
