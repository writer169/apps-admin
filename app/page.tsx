import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

export default function HomePage() {
  const authenticated = isAuthenticated()
  
  if (authenticated) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}