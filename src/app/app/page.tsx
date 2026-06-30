import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppHome() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">
          Hos geldiniz{profile?.first_name ? `, ${profile.first_name}` : ''}!
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Uygulamaniz hazir. Kliniginiz transfer bilginizi girince takip sureciniz baslayacak.
        </p>
      </div>
      <p className="mt-8 text-xs text-gray-400">IVF Companion</p>
    </main>
  )
}
