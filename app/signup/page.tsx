import SignupForm from '@/components/signup-form'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/kamiwazaApi'

export default async function SignupPage() {
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
      <SignupForm />
    </main>
  )
}
