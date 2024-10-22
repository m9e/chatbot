import LoginForm from '@/components/login-form'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/kamiwazaApi'

export default async function LoginPage() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  
  if (token) {
    try {
      const userData = await verifyToken()
      if (userData) {
        redirect('/')
      }
    } catch (error) {
      console.error('Error verifying token:', error)
    }
  }

  return (
    <main className="flex flex-col p-4">
      <LoginForm />
    </main>
  )
}
