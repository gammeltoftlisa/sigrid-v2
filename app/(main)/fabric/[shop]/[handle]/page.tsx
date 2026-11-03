import type { Metadata } from 'next'

import { NotFoundMessage } from '@/components/patterns/not-found-message'
import { ShopProduct } from '@/components/shop/shop-product'
import { getProduct } from '@/lib/shop/product'

type Props = {
  params: Promise<{ shop: string; handle: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const decode = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shop, handle } = await params
  const product = await getProduct(decode(shop), decode(handle)).catch(() => null)
  return { title: product?.item.title ?? 'Product' }
}

/** One product from the shop: every photo, the shop's full description, and what it's made of */
export default async function ProductPage({ params, searchParams }: Props) {
  const { shop, handle } = await params
  const variant = Number((await searchParams).variant) || undefined
  const product = await getProduct(decode(shop), decode(handle))

  if (!product) {
    return (
      <NotFoundMessage
        title="This product isn’t in the shop"
        description="The shop may have sold out of it or taken it down, or the link is wrong. Everything else in the shop is still there."
        action={{ label: 'Go to the shop', href: '/fabric' }}
      />
    )
  }

  return <ShopProduct {...product} initialVariant={variant} />
}
