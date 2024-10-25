'use server'

import { ResultCode } from '@/lib/utils'
import { login } from '@/lib/kamiwazaApi'
import { cookies } from 'next/headers'

interface Result {
  type: string
  resultCode: ResultCode
}

export async function signup(
  _prevState: Result | undefined,
  formData: FormData
): Promise<Result | undefined> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    // Here you would typically make a call to your Kamiwaza API to create a user
    // For now, we'll just return success
    // const signupResult = await kamiwazaSignup(email, password)
    
    // After successful signup, login the user
    const loginResult = await login(email, password)
    if (loginResult.access_token) {
      cookies().set('access_token', loginResult.access_token)
      if (loginResult.refresh_token) {
        cookies().set('refreshToken', loginResult.refresh_token)
      }
      return {
        type: 'success',
        resultCode: ResultCode.UserCreated
      }
    }

    return {
      type: 'error',
      resultCode: ResultCode.UnknownError
    }
  } catch (error) {
    console.error('Signup error:', error)
    return {
      type: 'error',
      resultCode: ResultCode.UnknownError
    }
  }
}
