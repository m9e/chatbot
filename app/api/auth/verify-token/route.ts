import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
const KAMIWAZA_API_URI = process.env.KAMIWAZA_API_URI || 'http://localhost:7777';

export async function GET() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    console.log('verify-token: No token found in cookies')
    return NextResponse.json({ error: 'No token found' }, { status: 401 })
  }

  try {
    // Changed from /verify to /verify-token to match Kamiwaza API
    const response = await fetch(`${KAMIWAZA_API_URI}/api/auth/verify-token`, {
      headers: {
        'Authorization': `Bearer ${token}`
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
    console.log('verify-token: Successful verification for user:', userData.username)
    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error verifying token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
