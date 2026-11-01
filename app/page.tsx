import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

/** The site's address: Home when logged in, the login screen otherwise. */
export default async function RootPage() {
  const { userId } = await auth()
  redirect(userId ? '/home' : '/sign-in')
}
