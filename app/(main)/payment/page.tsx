import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { Panel, PanelRow, StepDot } from '@/components/patterns/panel'

const plans = [
  {
    id: 'per-project',
    name: 'Pay per project',
    price: '€7–15',
    period: 'per garment',
    description: '',
    features: ['Pattern in your size', 'Step-by-step guide'],
  },
  {
    id: 'subscription',
    name: 'Monthly subscription',
    price: 'Price to be decided',
    period: '',
    description: '',
    features: ['Unlimited patterns', 'Step-by-step guide'],
  },
]

export default function PaymentPage() {
  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Profile', href: '/profile' }, { label: 'Plans' }]}
        title="Plans" description="Free while we’re in beta. We’ll tell you before anything changes." />

      <div className="tile-grid tiles-wide">
        {plans.map((plan) => (
          <Panel
            key={plan.id}
            label={plan.name}
            meta="Coming soon"
          >
            <div className="flex flex-col gap-1 px-1 pb-2">
              <p className="flex items-baseline gap-1">
                <span className="font-heading text-3xl">{plan.price}</span>
                {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
              </p>
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
