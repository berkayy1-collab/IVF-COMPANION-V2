'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterForm({ clinicId }: { clinicId: string }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [kvkk, setKvkk] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!kvkk) {
      setError('Devam etmek icin KVKK onayini isaretleyin.')
      return
    }
    if (password.length < 6) {
      setError('Sifre en az 6 karakter olmalidir.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          clinic_id: clinicId,
          role: 'patient',
          first_name: firstName,
          last_name: lastName,
          phone,
        },
      },
    })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h1 className="mt-6 text-xl font-bold text-gray-900">Kayit basarili!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Hesabiniz olusturuldu. Kliniginiz transfer bilginizi girince
          uygulamaniz aktiflesecek.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-lg"
    >
      <h1 className="text-2xl font-bold text-gray-900">Kayit Ol</h1>
      <p className="mt-1 text-sm text-gray-500">Bilgilerinizi girin</p>

      <div className="mt-6 flex flex-col gap-4">
        <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="Ad" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="Soyad" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="Telefon" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="Sifre (en az 6 karakter)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <label className="flex items-start gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} className="mt-0.5" />
          <span>KVKK aydinlatma metnini okudum ve kisisel verilerimin islenmesini onayliyorum.</span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl px-6 py-3 font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: 'var(--clinic-primary)' }}
        >
          {loading ? 'Kaydediliyor...' : 'Kayit Ol'}
        </button>
      </div>
    </form>
  )
}
