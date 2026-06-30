'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'

interface Props {
  patientId: string
  clinicId: string
  hasTransferDate?: boolean
}

export default function MedicationForm({ patientId, clinicId, hasTransferDate }: Props) {
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [route, setRoute] = useState('')
  const [times, setTimes] = useState<string[]>(['08:00'])
  const [useTransferDay, setUseTransferDay] = useState(!!hasTransferDate)
  const [dayStart, setDayStart] = useState('-5')
  const [dayEnd, setDayEnd] = useState('14')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function addTime() { setTimes(t => [...t, '12:00']) }
  function removeTime(i: number) { setTimes(t => t.filter((_, idx) => idx !== i)) }
  function updateTime(i: number, val: string) { setTimes(t => t.map((v, idx) => idx === i ? val : v)) }

  function dayLabel(n: number) {
    if (n === 0) return 'Gun 0 (Transfer)'
    return n > 0 ? `Gun +${n}` : `Gun ${n}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setMessage('Ilac adi zorunludur.'); return }
    setLoading(true)
    setMessage('')
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const payload: any = {
      patient_id: patientId,
      clinic_id: clinicId,
      created_by: authUser?.id ?? null,
      name: name.trim(),
      dosage: dose.trim() || null,
      route: route.trim() || null,
      times_of_day: times.filter(Boolean),
      notes: instructions.trim() || null,
      is_active: true,
    }
    if (useTransferDay) {
      payload.transfer_day_start = parseInt(dayStart)
      payload.transfer_day_end = parseInt(dayEnd)
    } else {
      payload.start_date = startDate || null
      payload.end_date = endDate || null
    }
    const { error } = await supabase.from('medications').insert(payload)
    setLoading(false)
    if (error) {
      setMessage('Hata: ' + error.message)
    } else {
      setMessage('Ilac eklendi.')
      router.push(`/panel/patients/${patientId}`)
      router.refresh()
    }
  }

  const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ilac Adi *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="or. Progesteron" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doz</label>
          <input type="text" value={dose} onChange={e => setDose(e.target.value)} placeholder="or. 200mg" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Uygulama Yolu</label>
          <input type="text" value={route} onChange={e => setRoute(e.target.value)} placeholder="Vajinal, Oral..." className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Kullanim Saatleri</label>
        <div className="space-y-2">
          {times.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="time" value={t} onChange={e => updateTime(i, e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
              {times.length > 1 && (
                <button type="button" onClick={() => removeTime(i)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addTime} className="mt-2 flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700">
          <Plus className="w-4 h-4" /> Saat Ekle
        </button>
      </div>

      <div className="border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Surelendirme</label>
          <div className="flex rounded-lg border overflow-hidden text-xs">
            <button type="button" onClick={() => setUseTransferDay(true)}
              className={`px-3 py-1.5 transition-colors ${useTransferDay ? 'bg-rose-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Transfer Gunune Gore
            </button>
            <button type="button" onClick={() => setUseTransferDay(false)}
              className={`px-3 py-1.5 transition-colors ${!useTransferDay ? 'bg-rose-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Takvim Tarihi
            </button>
          </div>
        </div>

        {useTransferDay ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Baslangic Gunu</label>
                <input type="number" value={dayStart} onChange={e => setDayStart(e.target.value)}
                  className={inputCls} placeholder="-5" />
                {dayStart !== '' && <p className="text-xs text-rose-600 mt-1">{dayLabel(parseInt(dayStart) || 0)}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bitis Gunu</label>
                <input type="number" value={dayEnd} onChange={e => setDayEnd(e.target.value)}
                  className={inputCls} placeholder="14" />
                {dayEnd !== '' && <p className="text-xs text-rose-600 mt-1">{dayLabel(parseInt(dayEnd) || 0)}</p>}
              </div>
            </div>
            <p className="text-xs text-gray-400">0 = transfer gunu, negatif = oncesi, pozitif = sonrasi</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Baslangic Tarihi</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bitis Tarihi</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kullanim Talimati</label>
        <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
          rows={3} placeholder="Hastaya gosterilecek aciklama..." className={inputCls} />
      </div>

      {message && (
        <p className={`text-sm ${message.startsWith('Hata') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-rose-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50">
          {loading ? 'Ekleniyor...' : 'Ilac Ekle'}
        </button>
        <button type="button" onClick={() => router.back()} className="border px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
          Iptal
        </button>
      </div>
    </form>
  )
}
