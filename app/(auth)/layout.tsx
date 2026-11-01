import { AuthShell } from '@/components/patterns/auth-shell'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>
}
