import { CoreMessage } from 'ai'
import { Session as NextAuthSession } from 'next-auth'
import { UserData } from '@/lib/kamiwazaApi'

export type Message = CoreMessage & {
  id: string
}


export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
  selectedModel?: ModelInfo | null
}

export interface ModelInfo {
  baseUrl: string
  modelName: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>

export interface Session extends NextAuthSession {
  user: {
    id: string
    email: string
    isAnonymous: boolean
  }
}

export interface AuthResult {
  type: string
  message: string
}

export interface User extends Record<string, any> {
  id: string
  email: string
  password: string
  salt: string
  isAnonymous: boolean
}
