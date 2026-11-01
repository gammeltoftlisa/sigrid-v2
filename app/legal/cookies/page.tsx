import { Inset } from '@/components/patterns/inset'
import { LegalPage, LegalSection } from '@/components/patterns/legal-page'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const metadata = { title: 'Cookie policy · Sigrid' }

const storage = [
  { key: 'sigrid_project_…', what: 'Your size and how far you’ve come in each garment', kept: 'Until you clear it' },
  { key: 'sigrid_user_size', what: 'The size new patterns start in, and when you chose it', kept: 'Until you clear it' },
  { key: 'sigrid_sync_owner', what: 'Which account the sewing saved in this browser belongs to', kept: 'Until you log out' },
  { key: 'sigrid_activity', what: 'The days you marked steps done, for your streak', kept: 'Until you clear it' },
  { key: 'sigrid_fabric_bag', what: 'Fabrics you added to your bag', kept: 'Until you clear it' },
  { key: 'sigrid_welcomed', what: 'That you’ve seen the welcome screens, so they don’t show again', kept: 'Until you clear it' },
  { key: 'sigrid_ready_…', what: 'That you’ve seen “Before you start” for a pattern', kept: 'Until you clear it' },
]

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie policy" intro="Sigrid doesn’t use cookies. It saves a few things in your browser so the app works, and nothing for tracking.">
      <LegalSection title="Why there’s no cookie banner">
        <p>
          Swedish law (lagen om elektronisk kommunikation, 9 kap. 28 §) requires consent for storing information on your device,
          except when it is strictly necessary for a service you asked for. Everything Sigrid stores is needed for features you
          use, like remembering your progress, so no consent banner is needed. If we ever add analytics or anything not strictly
          necessary, we will ask first.
        </p>
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
        <p>None of this is sent to us or to anyone else.</p>
      </LegalSection>

      <LegalSection title="Third parties">
        <p>
          Sigrid has no embedded videos, maps, social media widgets or ad scripts. Product photos are fetched through our own server,
          so your browser doesn’t contact the photo or shop sites until you choose to open a shop.
        </p>
      </LegalSection>

      <LegalSection title="How to remove it">
        <p>Clear site data for Sigrid in your browser settings. Your projects and bag on this device will be reset.</p>
      </LegalSection>
    </LegalPage>
  )
}
