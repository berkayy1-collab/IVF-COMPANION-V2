'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('E-posta veya şifre hatalı.')
      return
    }
    router.push('/app')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900">Giriş Yap</h1>
      <p className="mt-1 text-sm text-gray-500">Hesabınıza giriş yapın</p>
      <div className="mt-6 flex flex-col gap-4">
        <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="Şifre" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="rounded-xl px-6 py-3 font-semibold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--clinic-primary)' }}>
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </div>
    </form>
  )
}
