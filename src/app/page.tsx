import { redirect } from 'next/navigation'

// Root path redirect: / → /en
export default function RootPage() {
  redirect('/en')
}
