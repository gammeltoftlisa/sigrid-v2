import { IconCheck, IconInfoCircle } from '@tabler/icons-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'

const plans = [
  {
    id: 'per-project',
    name: 'Pay per project',
    price: '€7–15',
    period: 'per garment',
    description: 'Good for getting started',
    features: ['One pattern at a time', 'Full step-by-step sewing guide', 'Patterns in sizes XS–XXL', 'Material guide'],
  },
  {
    id: 'subscription',
    name: 'Monthly subscription',
    price: 'Price to be decided',
    period: '',
    description: 'For people who sew a lot',
    features: ['Unlimited patterns', 'Full step-by-step sewing guide', 'Priority support', 'Early access to new features'],
  },
]

export default function PaymentPage() {
  return (
    <PageContainer className="max-w-3xl">
      <PageHeader back="/profile" title="Plans" description="Sigrid is free during the beta. Paid plans are coming later." />

      <Alert>
        <IconInfoCircle />
        <AlertTitle>You’re in the beta</AlertTitle>
        <AlertDescription>Everything is free while we build. No card needed.</AlertDescription>
      </Alert>

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
                Not available yet
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </PageContainer>
  )
}
