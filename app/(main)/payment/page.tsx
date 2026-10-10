import { IconCheck } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
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

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="text-base">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <Badge variant="secondary" className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                Coming soon
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold tracking-tight">{plan.price}</span>
                {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
              </p>
              <ul className="flex flex-col gap-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <IconCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button variant="outline" className="w-full" disabled>
                Coming later
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </PageContainer>
  )
}
