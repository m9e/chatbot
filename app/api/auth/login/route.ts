import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { login } from '@/lib/kamiwazaApi'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    const loginResult = await login(username, password)

    // Set the cookie server-side
    cookies().set({
      name: 'access_token',
      value: loginResult.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: loginResult.expires_in
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 401 }
    )
  }
}
