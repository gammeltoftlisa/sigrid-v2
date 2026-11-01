import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'

/** Sign-up collects an email, so what happens to it is one link away. Agreeing to the terms comes next, in the welcome. */
export default function SignUpPage() {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <SignUp />
      <p className="text-center text-xs text-muted-foreground">
        Read how we handle your data in our{' '}
        <Link href="/legal/privacy" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-foreground">Privacy policy</Link>.
      </p>
    </div>
  )
}
