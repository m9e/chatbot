import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/kamiwazaApi'
import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userData = await verifyToken()
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userKey = `user:chat:${userData.id}`
    console.log('Getting chat history for user:', userKey)

    // Get all chat IDs for user
    const chatKeys = await redis.zrange(userKey, 0, -1)
    console.log('Found chat keys:', chatKeys)

    // Get chat data for each ID
    const chats = await Promise.all(
      chatKeys.map(async (key) => {
        const chatData = await redis.hgetall(key)
        return chatData ? {
          ...chatData,
          messages: JSON.parse(chatData.messages || '[]'),
          selectedModel: JSON.parse(chatData.selectedModel || 'null')
        } : null
      })
    )

    console.log('Retrieved chats:', chats.length)
    return NextResponse.json({ chats: chats.filter(Boolean) })
  } catch (error) {
    console.error('Error getting chat history:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}