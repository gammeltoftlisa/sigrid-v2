import { IconShoppingBag } from '@tabler/icons-react'

import { PanelRow, StepDot } from '@/components/patterns/panel'
import { supplyHref, type Supply } from '@/lib/fabric/supplies'

/** The things a pattern needs, one row each. A row opens that supply in the shop, for this pattern. */
export function SupplyRows({ garmentId, supplies, current }: { garmentId: string; supplies: Supply[]; current?: string | null }) {
  return supplies.map((s) => (
    <PanelRow
      key={s.id}
      href={s.search ? supplyHref(garmentId, s) : undefined}
      state={s.id === current ? 'active' : 'upcoming'}
      leading={<StepDot state={s.id === current ? 'active' : 'upcoming'}>{s.search && <IconShoppingBag className="size-3.5" />}</StepDot>}
      title={s.name}
      detail={s.detail}
    />
  ))
}
