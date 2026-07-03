'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  User, Calendar, Pill, Activity, MessageSquare, FileText,
  Phone, MapPin, Heart, AlertCircle, Send, Plus, ExternalLink, Trash2
} from 'lucide-react'
type Tab = 'overview' | 'medications' | 'symptoms' | 'messages' | 'notes'
interface Props {
  patient: any
  medications: any[]
  symptomLogs: any[]
  conversationId: string | null
  messages: any[]
  clinicalNotes: any[]
  currentUserId: string
}
const SL: Record<string, string> = {
  bleeding: 'Kanama', cramping: 'Kramp', nausea: 'Mide Bulantısı',
  fatigue: 'Yorgunluk', headache: 'Baş Ağrısı', bloating: 'Şişkinlik',
  spotting: 'Lekelenme', breast_tenderness: 'Göğüs Hassasiyeti',
  heavy_bleeding: 'Yoğun Kanama', severe_pain: 'Şiddetli Ağrı',
  fainting: 'Bayılma', fever: 'Ateş',
}
const CRIT = ['heavy_bleeding', 'severe_pain', 'fainting', 'fever']
function timeAgo(d: string) {
  const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (min < 1) return 'Az önce'
  if (min < 60) return `${min} dk önce`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} sa önce`
  return new Date(d).toLocaleDateString('tr-TR')
}
function transferDayCount(transferDate: string | null): number | null {
  if (!transferDate) return null
  return Math.floor((Date.now() - new Date(transferDate).getTime()) / 86400000)
}
export default function PatientDetail({
  patient, medications, symptomLogs, conversationId, messages: initialMessages, clinicalNotes, currentUserId
}: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [status, setStatus] = useState<string>(patient.status)
  const [startedElsewhere, setStartedElsewhere] = useState<boolean>(patient.started_elsewhere ?? false)
  const [meds, setMeds] = useState(medications)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [messages, setMessages] = useState(initialMessages)
  const [msgBody, setMsgBody] = useState('')
  const [sending, setSending] = useState(false)
  const [noteBody, setNoteBody] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [notes, setNotes] = useState(clinicalNotes)
  const supabase = createClient()
  const u = patient.users as any
  const fullName = u?.full_name ?? '—'
  const dayCount = transferDayCount(patient.transfer_date)
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!msgBody.trim() || !conversationId || sending) return
    setSending(true)
    const { data } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      sender_role: 'staff',
      body: msgBody.trim(),
    }).select().single()
    if (data) setMessages(prev => [...prev, data])
    setMsgBody('')
    setSending(false)
  }
  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteBody.trim()) return
    setAddingNote(true)
    const { data } = await supabase.from('clinical_notes').insert({
      patient_id: patient.id,
      author_id: currentUserId,
      body: noteBody.trim(),
    }).select('*, users(full_name)').single()
    if (data) setNotes(prev => [data, ...prev])
    setNoteBody('')
    setAddingNote(false)
  }
  async function toggleNotStarted() {
    const newStatus = status === 'not_started' ? 'active' : 'not_started'
    const { error } = await supabase.from('patients').update({ status: newStatus }).eq('id', patient.id)
    if (!error) {
      setStatus(newStatus)
    } else {
      alert('Durum güncellenemedi: ' + error.message)
    }
  }
  async function toggleStartedElsewhere() {
    const newValue = !startedElsewhere
    const { error } = await supabase.from('patients').update({ started_elsewhere: newValue }).eq('id', patient.id)
    if (!error) {
      setStartedElsewhere(newValue)
    } else {
      alert('Güncellenemedi: ' + error.message)
    }
  }
  async function deleteMedication(id: string) {
    if (!confirm('Bu ilacı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return
    setDeletingId(id)
    const { error } = await supabase.from('medications').delete().eq('id', id)
    setDeletingId(null)
    if (!error) {
      setMeds(prev => prev.filter(m => m.id !== id))
    } else {
      alert('Silinemedi: ' + error.message)
    }
  }
  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Genel', icon: User },
    { id: 'medications', label: 'İlaçlar', icon: Pill },
    { id: 'symptoms', label: 'Belirtiler', icon: Activity },
    { id: 'messages', label: 'Mesajlar', icon: MessageSquare },
    { id: 'notes', label: 'Notlar', icon: FileText },
  ]
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              status === 'active' ? 'bg-green-100 text-green-700' :
              status === 'completed' ? 'bg-blue-100 text-blue-700' :
              status === 'not_started' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {status === 'active' ? 'Aktif' : status === 'completed' ? 'Tamamlandı' : status === 'not_started' ? 'Tedaviye Başlanmadı' : 'İptal'}
            </span>
            {dayCount !== null && (
              <span className="text-xs text-gray-500">
                {dayCount >= 0 ? `Transfer +${dayCount}. gün` : `Transfer ${Math.abs(dayCount)} gün sonra`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-orange-700 border border-orange-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-orange-50 transition-colors">
            <input type="checkbox" checked={status === 'not_started'} onChange={toggleNotStarted} className="accent-orange-600" />
            Tedaviye Başlanmadı
          </label>
          <label className="flex items-center gap-1.5 text-xs font-medium text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-blue-50 transition-colors">
            <input type="checkbox" checked={startedElsewhere} onChange={toggleStartedElsewhere} className="accent-blue-600" />
            Tedaviye Farklı Bir Merkezde Başladı
          </label>
          <Link href={`/panel/patients/${patient.id}/profile`}
            className="flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 border border-rose-200 rounded-lg px-3 py-1.5 hover:bg-rose-50 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Profili Düzenle
          </Link>
        </div>
      </div>
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Calendar className="w-4 h-4 text-rose-500" /> IVF Takvimi</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transfer Tarihi</span>
                  <span className="font-medium">{patient.transfer_date ? new Date(patient.transfer_date).toLocaleDateString('tr-TR') : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Beta HCG</span>
                  <span className="font-medium">{patient.beta_hcg_date ? new Date(patient.beta_hcg_date).toLocaleDateString('tr-TR') : '—'}</span>
                </div>
                {patient.embryo_count && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Embriyo Sayısı</span>
                    <span className="font-medium">{patient.embryo_count}</span>
                  </div>
                )}
                {patient.previous_ivf_count > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Önceki IVF</span>
                    <span className="font-medium">{patient.previous_ivf_count} deneme</span>
                  </div>
                )}
              </div>
              <Link href={`/panel/patients/${patient.id}/dates`} className="text-xs text-rose-600 hover:underline">Tarihleri düzenle →</Link>
            </div>
            <div className="bg-white border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Phone className="w-4 h-4 text-rose-500" /> İletişim</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">E-posta</span>
                  <span className="font-medium text-right">{u?.email ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Telefon</span>
                  <span className="font-medium">{patient.phone ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Şehir</span>
                  <span className="font-medium">{patient.city ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Doğum Tarihi</span>
                  <span className="font-medium">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('tr-TR') : '—'}</span>
                </div>
              </div>
            </div>
            <div className="bg-white border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500" /> Medikal Bilgi</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Kan Grubu</span>
                  <span className="font-medium">{patient.blood_type ?? '—'}</span>
                </div>
                {patient.allergies && (
                  <div>
                    <span className="text-gray-500 block">Alerjiler</span>
                    <span className="text-gray-800">{patient.allergies}</span>
                  </div>
                )}
                {patient.chronic_conditions && (
                  <div>
                    <span className="text-gray-500 block">Kronik Hastalıklar</span>
                    <span className="text-gray-800">{patient.chronic_conditions}</span>
                  </div>
                )}
                {!patient.allergies && !patient.chronic_conditions && <span className="text-gray-400">Bilgi girilmemiş</span>}
              </div>
            </div>
            <div className="bg-white border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-rose-500" /> Acil İletişim</h3>
              {patient.emergency_contact_name ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{patient.emergency_contact_name}</p>
                  <p className="text-gray-500">{patient.emergency_contact_phone ?? '—'}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Acil iletişim girilmemiş</p>
              )}
            </div>
          </div>
          {patient.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800 mb-1">Klinik Notlar</p>
              <p className="text-sm text-amber-700">{patient.notes}</p>
            </div>
          )}
          {patient.anamnesis_file_url && (
            <div className="bg-white border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-500" />
                <span className="text-sm font-medium text-gray-700">Anamnez Formu</span>
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Yüklü</span>
            </div>
          )}
        </div>
      )}
      {tab === 'medications' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700">{meds.length} ilaç kayıtlı</h3>
            <Link href={`/panel/patients/${patient.id}/medications`}
              className="flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700">
              <Plus className="w-4 h-4" /> İlaç Ekle
            </Link>
          </div>
          {meds.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Henüz ilaç eklenmemiş.</p>}
          {meds.map((med: any) => (
            <div key={med.id} className="bg-white border rounded-xl overflow-hidden">
              {/* İlaç başlık */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900">{med.name}</p>
                  <button
                    type="button"
                    onClick={() => deleteMedication(med.id)}
                    disabled={deletingId === med.id}
                    className="text-gray-400 hover:text-red-600 disabled:opacity-50 shrink-0"
                    title="İlacı sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {med.route && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{med.route}</span>}
                  {med.daily_dosage && (
                    <span className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-medium">
                      Günlük (ort.): {med.daily_dosage} {med.dosage || ""}
                    </span>
                  )}
                  {med.total_dosage && (
                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                      Toplam: {med.total_dosage}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'symptoms' && (
        <div className="space-y-3">
          {symptomLogs.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Henüz belirti kaydedilmemiş.</p>}
          {symptomLogs.map((log: any) => {
            const isCrit = log.symptoms?.some((s: string) => CRIT.includes(s))
            return (
              <div key={log.id} className={`border rounded-xl p-4 ${isCrit ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{timeAgo(log.created_at)}</span>
                  {isCrit && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Kritik</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {log.symptoms?.map((s: string) => (
                    <span key={s} className={`text-xs px-2 py-1 rounded-full ${CRIT.includes(s) ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {SL[s] ?? s}
                    </span>
                  ))}
                </div>
                {log.severity && <p className="text-xs text-gray-500 mt-1">Şiddet: {log.severity}/10</p>}
                {log.notes && <p className="text-sm text-gray-700 mt-2">{log.notes}</p>}
              </div>
            )
          })}
        </div>
      )}
      {tab === 'messages' && (
        <div className="flex flex-col h-[500px] bg-white border rounded-xl overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && <p className="text-sm text-gray-400 text-center mt-8">Henüz mesaj yok.</p>}
            {messages.map((msg: any) => {
              const isStaff = msg.sender_role !== 'patient'
              return (
                <div key={msg.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${isStaff ? 'bg-rose-500 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'}`}>
                    <p>{msg.body}</p>
                    <p className={`text-xs mt-1 ${isStaff ? 'text-rose-200' : 'text-gray-400'}`}>{timeAgo(msg.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
          {conversationId ? (
            <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
              <input type="text" value={msgBody} onChange={e => setMsgBody(e.target.value)} placeholder="Mesaj yazın..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
              <button type="submit" disabled={sending || !msgBody.trim()}
                className="bg-rose-600 text-white p-2 rounded-lg hover:bg-rose-700 disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <p className="p-3 text-sm text-gray-400 text-center border-t">Hasta henüz uygulamaya giriş yapmamış.</p>
          )}
        </div>
      )}
      {tab === 'notes' && (
        <div className="space-y-4">
          <form onSubmit={addNote} className="bg-white border rounded-xl p-4 space-y-3">
            <label className="text-sm font-medium text-gray-700">Yeni Klinik Not</label>
            <textarea value={noteBody} onChange={e => setNoteBody(e.target.value)}
              rows={3} placeholder="Not ekle..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            <button type="submit" disabled={addingNote || !noteBody.trim()}
              className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50">
              {addingNote ? 'Ekleniyor...' : 'Not Ekle'}
            </button>
          </form>
          {( notes || []).length === 0 && <p className="text-sm text-gray-400 text-center py-8">Henüz not eklenmemiş.</p>}
          {(notes || []).map((note: any) => (
            <div key={note.id} className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">{note.users?.full_name ?? 'Personel'}</span>
                <span className="text-xs text-gray-400">{timeAgo(note.created_at)}</span>
              </div>
              <p className="text-sm text-gray-800">{note.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}