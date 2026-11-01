'use client'

import { use } from 'react'

import { PatternFabric } from '@/components/shop/pattern-fabric'
import { ShopPage } from '@/components/shop/shop-page'

type Params = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** With a pattern in the link: exactly what it needs. Without: the whole store. */
export default function FabricPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = use(searchParams)
  const garment = one(params.garment)
  if (garment) return <PatternFabric params={{ garment, choice: one(params.choice), supply: one(params.supply) }} />
  return <ShopPage params={params} />
}
