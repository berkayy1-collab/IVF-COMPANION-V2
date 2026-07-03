'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPatient } from '@/lib/actions/createPatient'

export default function NewPatientForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    const result = await createPatient(formData)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    }
  }

  const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none'

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg">
      <section className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Hasta Bilgileri</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
            <input name="firstName" type="text" required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Soyad *</label>
            <input name="lastName" type="text" required className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
          <input name="phone" type="tel" placeholder="+90 555 000 00 00" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
          <input name="email" type="email" required className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Geçici Şifre * (en az 6 karakter)</label>
          <input name="password" type="text" required minLength={6} className={inputCls} />
          <p className="text-xs text-gray-400 mt-1">
            Bu şifreyi siz belirliyorsunuz. Hasta, mobil uygulamaya bu e-posta ve şifre ile giriş yapacak — bilgileri hastaya siz ileteceksiniz.
          </p>
        </div>
      </section>

      {error && (
        <p className="text-sm font-medium text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-rose-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50">
          {loading ? 'Oluşturuluyor...' : 'Hastayı Oluştur'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="border px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
          İptal
        </button>
      </div>
    </form>
  )
}