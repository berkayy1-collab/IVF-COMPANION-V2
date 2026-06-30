'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText } from 'lucide-react'

interface Props {
  patient: any
  patientName: string
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-']

export default function PatientProfileForm({ patient, patientName }: Props) {
  const [form, setForm] = useState({
    phone: patient.phone ?? '',
    city: patient.city ?? '',
    date_of_birth: patient.date_of_birth ?? '',
    blood_type: patient.blood_type ?? '',
    allergies: patient.allergies ?? '',
    chronic_conditions: patient.chronic_conditions ?? '',
    previous_ivf_count: patient.previous_ivf_count?.toString() ?? '0',
    embryo_count: patient.embryo_count?.toString() ?? '',
    emergency_contact_name: patient.emergency_contact_name ?? '',
    emergency_contact_phone: patient.emergency_contact_phone ?? '',
    notes: patient.notes ?? '',
  })
  const [uploading, setUploading] = useState(false)
  const [filePath, setFilePath] = useState<string | null>(patient.anamnesis_file_url ?? null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  function upd(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${patient.id}/anamnez-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('patient-files').upload(path, file, { upsert: true })
    if (error) {
      setMessage('Dosya hatasi: ' + error.message)
    } else {
      await supabase.from('patients').update({ anamnesis_file_url: path }).eq('id', patient.id)
      setFilePath(path)
      setMessage('Dosya yuklendi.')
    }
    setUploading(false)
  }

  async function viewFile() {
    if (!filePath) return
    const { data } = await supabase.storage.from('patient-files').createSignedUrl(filePath, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const { error } = await supabase.from('patients').update({
      phone: form.phone || null,
      city: form.city || null,
      date_of_birth: form.date_of_birth || null,
      blood_type: form.blood_type || null,
      allergies: form.allergies || null,
      chronic_conditions: form.chronic_conditions || null,
      previous_ivf_count: form.previous_ivf_count ? parseInt(form.previous_ivf_count) : 0,
      embryo_count: form.embryo_count ? parseInt(form.embryo_count) : null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      notes: form.notes || null,
    }).eq('id', patient.id)
    setSaving(false)
    if (error) {
      setMessage('Hata: ' + error.message)
    } else {
      setMessage('Kaydedildi.')
      router.push(`/panel/patients/${patient.id}`)
      router.refresh()
    }
  }

  const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none'

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">

      <section className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Kisisel Bilgiler</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input type="tel" value={form.phone} onChange={e => upd('phone', e.target.value)} placeholder="+90 555 000 00 00" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sehir</label>
            <input type="text" value={form.city} onChange={e => upd('city', e.target.value)} placeholder="Istanbul" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dogum Tarihi</label>
            <input type="date" value={form.date_of_birth} onChange={e => upd('date_of_birth', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kan Grubu</label>
            <select value={form.blood_type} onChange={e => upd('blood_type', e.target.value)} className={inputCls}>
              <option value="">Secin</option>
              {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Medikal Gecmis</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alerjiler</label>
          <textarea value={form.allergies} onChange={e => upd('allergies', e.target.value)}
            rows={2} placeholder="Ilac, gida alerjileri..." className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kronik Hastaliklar</label>
          <textarea value={form.chronic_conditions} onChange={e => upd('chronic_conditions', e.target.value)}
            rows={2} placeholder="Diyabet, hipertansiyon..." className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Onceki IVF Denemesi</label>
            <input type="number" min="0" value={form.previous_ivf_count} onChange={e => upd('previous_ivf_count', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Edilen Embriyo Sayisi</label>
            <input type="number" min="0" value={form.embryo_count} onChange={e => upd('embryo_count', e.target.value)} placeholder="1" className={inputCls} />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Acil Iletisim</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input type="text" value={form.emergency_contact_name} onChange={e => upd('emergency_contact_name', e.target.value)} placeholder="Es, anne, baba..." className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input type="tel" value={form.emergency_contact_phone} onChange={e => upd('emergency_contact_phone', e.target.value)} placeholder="+90 555 000 00 00" className={inputCls} />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Klinik Notlar</h2>
        <textarea value={form.notes} onChange={e => upd('notes', e.target.value)}
          rows={4} placeholder="Ozel durumlar, klinik gozlemler..." className={inputCls} />
      </section>

      <section className="bg-white rounded-xl border p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Anamnez Formu</h2>
        <input type="file" ref={fileRef} onChange={handleFile} accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
        {filePath ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700 flex-1">Anamnez dosyasi mevcut</span>
            <button type="button" onClick={viewFile} className="text-sm text-rose-600 hover:underline">Goruntule</button>
            <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-gray-500 hover:text-gray-700">Degistir</button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-lg px-6 py-5 text-sm text-gray-500 hover:border-rose-400 hover:text-rose-600 transition-colors disabled:opacity-50 justify-center">
            <Upload className="w-5 h-5" />
            {uploading ? 'Yukleniyor...' : 'PDF veya resim yukle (anamnez formu)'}
          </button>
        )}
      </section>

      {message && (
        <p className={`text-sm font-medium ${message.startsWith('Hata') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
      )}

      <div className="flex gap-3 pb-8">
        <button type="submit" disabled={saving}
          className="bg-rose-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50">
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="border px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
          Iptal
        </button>
      </div>
    </form>
  )
}
