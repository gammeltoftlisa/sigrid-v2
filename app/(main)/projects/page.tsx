import { redirect } from 'next/navigation'

// Everything that was on Projects is on Home now; this keeps old links working.
export default function ProjectsPage() {
  redirect('/home')
}
