'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  patientId: string
  currentTransferDate: string | null
  currentBetaDate: string | null
}

export default function DateForm({ patientId, currentTransferDate, currentBetaDate }: Props) {
  const [transferDate, setTransferDate] = useState(currentTransferDate ?? '')
  const [betaDate, setBetaDate] = useState(currentBetaDate ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function handleTransferChange(value: string) {
    setTransferDate(value)
    if (value) {
      const d = new Date(value)
      d.setDate(d.getDate() + 12)
      setBetaDate(d.toISOString().split('T')[0])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await supabase
      .from('patients')
      .update({ transfer_date: transferDate || null, beta_hcg_date: betaDate || null })
      .eq('id', patientId)
    setLoading(false)
    if (error) {
      setMessage('Hata: ' + error.message)
    } else {
      setMessage('Tarihler kaydedildi.')
      router.push(`/panel/patients/${patientId}`)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Embriyo Transfer Tarihi</label>
        <input
          type="date"
          value={transferDate}
          onChange={e => handleTransferChange(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Beta HCG Test Tarihi</label>
        <input
          type="date"
          value={betaDate}
          onChange={e => setBetaDate(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
        <p className="text-xs text-gray-400 mt-1">Transfer tarihi girilirse otomatik hesaplanır (transfer +12 gün)</p>
      </div>
      {message && (
        <p className={`text-sm ${message.startsWith('Hata') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-rose-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
        >
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          İptal
        </button>
      </div>
    </form>
  )
}
