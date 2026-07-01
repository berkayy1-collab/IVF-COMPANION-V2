'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  clinicId: string
  initialName: string
  initialColor: string
  initialEmail: string
  initialPhone: string
  initialAddress: string
}

export default function SettingsForm({
  clinicId, initialName, initialColor, initialEmail, initialPhone, initialAddress
}: Props) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor || '#e11d48')
  const [email, setEmail] = useState(initialEmail)
  const [phone, setPhone] = useState(initialPhone)
  const [address, setAddress] = useState(initialAddress)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await supabase
      .from('clinics')
      .update({
        name: name.trim(),
        primary_color: color,
        contact_email: email.trim() || null,
        contact_phone: phone.trim() || null,
        address: address.trim() || null,
      })
      .eq('id', clinicId)
    setLoading(false)
    setMessage(error ? 'Hata: ' + error.message : 'Ayarlar kaydedildi.')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Klinik Adı</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tema Rengi</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="h-10 w-16 rounded-lg border cursor-pointer"
          />
          <span className="text-sm text-gray-500 font-mono">{color}</span>
          <div className="w-8 h-8 rounded-full border-2 border-gray-200" style={{ backgroundColor: color }} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">İletişim E-postası</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="klinik@ornek.com"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+90 555 000 00 00"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>
      {message && (
        <p className={`text-sm font-medium ${message.startsWith('Hata') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="bg-rose-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
      >
        {loading ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </form>
  )
}
