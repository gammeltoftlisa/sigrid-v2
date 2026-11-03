import { redirect } from 'next/navigation'

/** My patterns moved onto You, so old links and bookmarks land there */
export default function MyPatternsPage() {
  redirect('/profile')
}
