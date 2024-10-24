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
  console.log('Token from cookies:', token ? token.substring(0, 10) + '...' : 'No token found') // Updated debug line

  if (!token) {
    console.log('getUserData: No token present in cookies')
    return null
  }

  try {
    const userData = await verifyToken(token)
    console.log('getUserData: UserData after verify:', userData)
    return userData
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

export async function getChats(userId?: string) {
  console.log('getChats: Starting for userId:', userId)
  
  if (!userId) {
    console.log('getChats: No userId provided')
    return []
  }

  try {
    // Get chat IDs from sorted set
    const userKey = `user:chat:${userId}`
    const chatKeys = await redis.zrange(userKey, 0, -1)
    console.log('getChats: Found chat keys:', chatKeys)

    if (!chatKeys.length) {
      console.log('getChats: No chats found')
      return []
    }

    // Get all chats data using pipeline
    const pipeline = redis.pipeline()
    for (const key of chatKeys) {
      pipeline.hgetall(key)
    }

    const results = await pipeline.exec()
    console.log('getChats: Raw results:', results?.length)

    // Process results
    const chats = results
      ?.map(([err, data]) => {
        if (err || !data) {
          console.log('getChats: Error or no data for chat')
          return null
        }
        try {
          return {
            ...data as any,
            messages: JSON.parse((data as any).messages || '[]'),
            createdAt: new Date((data as any).createdAt),
            selectedModel: (data as any).selectedModel ? JSON.parse((data as any).selectedModel) : null
          }
        } catch (e) {
          console.error('getChats: Error parsing chat data:', e)
          return null
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

    console.log('getChats: Returning chats:', chats?.length)
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
      id: chatData.id,
      title: chatData.title,
      userId: chatData.userId,
      path: chatData.path,
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

  console.log('removeChat: UserData:', userData)

  if (!userData) {
    return {
      error: 'Unauthorized'
    }
  }

  // Get userId from Redis hash
  const uid = await redis.hget(`chat:${id}`, 'userId')

  console.log('removeChat: uid:', uid)

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
      id: chatData.id,
      title: chatData.title,
      userId: chatData.userId,
      path: chatData.path,
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
      id: chatData.id,
      title: chatData.title,
      userId: chatData.userId,
      path: chatData.path,
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
  const userKey = `user:chat:${chat.userId}`
  console.log('saveChat: Using Redis keys:', { chatKey, userKey })

  try {
    // Prepare chat data for hash storage
    const chatData = {
      id: chat.id,
      userId: chat.userId,
      title: chat.title,
      path: chat.path,
      messages: JSON.stringify(chat.messages),
      createdAt: chat.createdAt.toISOString(),
      selectedModel: JSON.stringify(chat.selectedModel)
    }

    // Save chat data as hash
    await redis.hmset(chatKey, chatData)
    
    // Add to user's sorted set (without chat: prefix in the member)
    if (chat.userId !== 'anonymous') {
      const score = new Date(chat.createdAt).getTime()
      console.log('saveChat: Adding to user chat list:', {
        userId: chat.userId,
        chatId: chat.id,
        score
      })
      await redis.zadd(userKey, score, chatKey)
    }

    console.log('saveChat: Successfully saved chat')
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
