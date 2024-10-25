import { cookies } from 'next/headers'

export async function getServerSideToken(): Promise<string | null> {
  try {
    const cookieStore = cookies()
    return cookieStore.get('access_token')?.value || null
  } catch (error) {
    console.error('Error accessing cookies:', error)
    return null
  }
}