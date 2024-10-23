'use server'

import { login } from '@/lib/kamiwazaApi'
import { cookies } from 'next/headers'
import { ResultCode } from '@/lib/utils'

interface Result {
  type: string
  resultCode: ResultCode
}

export async function authenticate(
  _prevState: Result | undefined,
  formData: FormData
): Promise<Result | undefined> {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  try {
    const loginResult = await login(username, password)
    if (loginResult.access_token) {
      cookies().set('token', loginResult.access_token)
      if (loginResult.refresh_token) {
        cookies().set('refreshToken', loginResult.refresh_token)
      }
      return {
        type: 'success',
        resultCode: ResultCode.UserLoggedIn
      }
    } else {
      return {
        type: 'error',
        resultCode: ResultCode.InvalidCredentials
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      type: 'error',
      resultCode: ResultCode.UnknownError
    }
  }
}
