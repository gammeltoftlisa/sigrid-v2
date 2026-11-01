import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { Panel, PanelRow, StepDot } from '@/components/patterns/panel'

const features = ['Pattern in your size', 'Step-by-step guide']

export default function PaymentPage() {
  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Profile', href: '/profile' }, { label: 'Pricing' }]}
        title="Pricing" description="You buy one pattern at a time. Free while we’re in beta. We’ll tell you before anything changes." />

      <div className="tile-grid tiles-wide">
        <Panel label="One pattern" meta="Coming soon">
          <div className="flex flex-col gap-1 px-1 pb-2">
            <p className="flex items-baseline gap-1">
              <span className="font-heading text-3xl">€7–15</span>
              <span className="text-sm text-muted-foreground">per pattern</span>
            </p>
          </div>
          {features.map((f) => (
            <PanelRow key={f} state="done" leading={<StepDot state="done" />} title={<span className="text-foreground">{f}</span>} />
          ))}
        </Panel>
      </div>
    </PageContainer>
  )
}
