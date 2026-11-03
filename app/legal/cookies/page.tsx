import { Inset } from '@/components/patterns/inset'
import { LegalPage, LegalSection } from '@/components/patterns/legal-page'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const metadata = { title: 'Cookie policy' }

const storage = [
  { key: 'sigrid_project_…', what: 'Your size and how far you’ve come in each garment', kept: 'Until you clear it' },
  { key: 'sigrid_user_size', what: 'The size new patterns start in, and when you chose it', kept: 'Until you clear it' },
  { key: 'sigrid_sync_owner', what: 'Which account the sewing saved in this browser belongs to', kept: 'Until you log out' },
  { key: 'sigrid_activity', what: 'The days you marked steps done, for your streak', kept: 'Until you clear it' },
  { key: 'sigrid_fabric_bag', what: 'Fabrics you added to your bag', kept: 'Until you clear it' },
  { key: 'sigrid_welcomed', what: 'That you’ve seen the welcome screens, so they don’t show again', kept: 'Until you clear it' },
  { key: 'sigrid_ready_…', what: 'That you’ve seen “Before you start” for a pattern', kept: 'Until you clear it' },
  { key: 'sigrid_consent', what: 'Your answer about usage statistics, so nothing loads before you’ve answered', kept: 'Until you clear it or change your answer' },
]

// Set by Clerk, which runs our login. Strictly necessary: without them you can't stay logged in.
const cookies = [
  { key: '__session, __client_uat, __clerk_db_jwt', what: 'Keep you logged in, securely', kept: 'Until you log out, or as set by Clerk' },
]

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie policy" intro="Sigrid only uses what it needs to work: login cookies and a few things saved in your browser. Usage statistics are optional, cookieless, and only with your yes.">
      <LegalSection title="What needs your yes, and what doesn’t">
        <p>
          Swedish law (lagen om elektronisk kommunikation, 9 kap. 28 §) requires consent for storing or reading information on your device, except when it’s
          strictly necessary for a service you asked for. Login cookies and the things below are strictly necessary, so they don’t need a yes.
        </p>
        <p>
          Usage statistics aren’t necessary, so Sigrid asks first. Until you choose <em>Accept</em>, the statistics script isn’t even loaded. <em>Reject</em>{' '}
          is just as easy, and you can change your answer anytime in Settings → Privacy. The statistics (Vercel Web Analytics) use no cookies and store nothing
          on your device.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <Inset className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs text-muted-foreground">Name</TableHead>
                <TableHead className="text-xs text-muted-foreground">What it’s for</TableHead>
                <TableHead className="text-xs text-muted-foreground">Kept</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cookies.map((s) => (
                <TableRow key={s.key}>
                  <TableCell className="font-mono text-xs whitespace-normal">{s.key}</TableCell>
                  <TableCell className="whitespace-normal">{s.what}</TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">{s.kept}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Inset>
      </LegalSection>

      <LegalSection title="What we store in your browser">
        <Inset className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs text-muted-foreground">Name</TableHead>
                <TableHead className="text-xs text-muted-foreground">What it’s for</TableHead>
                <TableHead className="text-xs text-muted-foreground">Kept</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storage.map((s) => (
                <TableRow key={s.key}>
                  <TableCell className="font-mono text-xs">{s.key}</TableCell>
                  <TableCell className="whitespace-normal">{s.what}</TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">{s.kept}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Inset>
        <p>This stays in your browser. When you’re logged in, your sewing and your answers are also saved on your account, as the privacy policy describes.</p>
      </LegalSection>

      <LegalSection title="Third parties">
        <p>
          Sigrid has no embedded videos, maps, social media widgets or ad scripts. Product photos are fetched through our own server,
          so your browser doesn’t contact the photo or shop sites until you choose to open a shop. On the login and sign-up pages, Clerk’s bot check
          (Cloudflare Turnstile) runs in your browser to stop automated sign-ups.
        </p>
      </LegalSection>

      <LegalSection title="How to remove it">
        <p>Clear site data for Sigrid in your browser settings. Your projects and bag on this device will be reset.</p>
      </LegalSection>
    </LegalPage>
  )
}
