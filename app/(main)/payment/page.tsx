import { Button } from '@/components/ui/button'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { Panel, PanelRow, StepDot } from '@/components/patterns/panel'
import { StatusMessage } from '@/components/patterns/status-message'

const plans = [
  {
    id: 'per-project',
    name: 'Pay per project',
    price: '€7–15',
    period: 'per garment',
    description: 'Pay once for each garment you make',
    features: ['One pattern at a time', 'Full step-by-step sewing guide', 'Patterns in sizes XS–XXL', 'Fabric and tools list'],
  },
  {
    id: 'subscription',
    name: 'Monthly subscription',
    price: 'Price to be decided',
    period: '',
    description: 'For when sewing becomes a habit',
    features: ['Unlimited patterns', 'Full step-by-step sewing guide', 'Priority support', 'Early access to new features'],
  },
]

export default function PaymentPage() {
  return (
    <PageContainer>
      <PageHeader
        back="/profile"
        breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Profile', href: '/profile' }, { label: 'Plans' }]}
        title="Plans" description="Sigrid is free while we’re in beta. This is what we’re planning, and nothing changes without telling you first." />

      <StatusMessage status="info" title="Free during the beta">
        No card and no trial that runs out. We’ll tell you well before anything changes.
      </StatusMessage>

      <div className="tile-grid grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Panel
            key={plan.id}
            label={plan.name}
            meta="Coming soon"
            footer={
              <Button variant="outline" className="w-full" disabled>
                Coming later
              </Button>
            }
          >
            <div className="flex flex-col gap-1 px-1 pb-2">
              <p className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold tracking-tight">{plan.price}</span>
                {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
              </p>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>
            {plan.features.map((f) => (
              <PanelRow key={f} state="done" leading={<StepDot state="done" />} title={<span className="text-foreground">{f}</span>} />
            ))}
          </Panel>
        ))}
      </div>
    </PageContainer>
  )
}
