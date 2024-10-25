import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
const KAMIWAZA_API_URI = process.env.KAMIWAZA_API_URI || 'http://localhost:7777';

export async function GET() {
  const cookieStore = cookies()
  const token = cookieStore.get('access_token')?.value  // Changed from 'token'

  if (!token) {
    console.log('verify-token: No access_token found in cookies')
    return NextResponse.json({ error: 'No token found' }, { status: 401 })
  }

  try {
    const response = await fetch(`${KAMIWAZA_API_URI}/api/auth/verify-token`, {
      headers: {
        'Cookie': `access_token=${token}`
      }
    })

    if (!response.ok) {
      console.error('verify-token: Failed with status:', response.status)
      return NextResponse.json(
        { error: 'Token verification failed' },
        { status: response.status }
      )
    }

    const userData = await response.json()
    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error verifying token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
