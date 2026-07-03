import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Bell, MessageSquare, AlertTriangle, Clock, CheckCircle, UserX } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color, href }: { icon: React.ElementType; label: string; value: number; color: string; href: string }) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} className="text-white" /></div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </Link>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const [
    { count: activePatients }, { count: openAlerts }, { count: unreadMsgs }, { count: notStartedPatients }, { count: totalPatients },
    { data: recentAlerts }, { data: recentConvs }, { data: notStartedList },
  ] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('messages').select('id', { count: 'exact', head: true }).is('read_at', null).eq('sender_role', 'patient'),
    supabase.from('patients').select('id', { count: 'exact', head: true }).eq('status', 'not_started'),
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    supabase.from('alerts').select('id, message, severity, created_at, patients(id, users(first_name, last_name))').eq('status', 'open').order('created_at', { ascending: false }).limit(5),
    supabase.from('conversations').select('id, last_message_at, patients(id, users(first_name, last_name))').order('last_message_at', { ascending: false, nullsFirst: false }).limit(5),
    supabase.from('patients').select('id, created_at, users(first_name, last_name)').eq('status', 'not_started').order('created_at', { ascending: false }).limit(5),
  ])

  const notStartedCount = notStartedPatients ?? 0
  const totalPatientsCount = totalPatients ?? 0
  const notStartedRatio = totalPatientsCount > 0 ? Math.round((notStartedCount / totalPatientsCount) * 100) : 0
  const ratioTier = notStartedRatio < 25 ? 'green' : notStartedRatio <= 75 ? 'orange' : 'red'
  const ratioStyles: Record<string, { icon: string; badgeBg: string; badgeText: string }> = {
    green: { icon: 'bg-green-500', badgeBg: 'bg-green-100', badgeText: 'text-green-700' },
    orange: { icon: 'bg-orange-500', badgeBg: 'bg-orange-100', badgeText: 'text-orange-700' },
    red: { icon: 'bg-red-500', badgeBg: 'bg-red-100', badgeText: 'text-red-700' },
  }
  const rc = ratioStyles[ratioTier]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gösterge Paneli</h1>
        <p className="text-sm text-gray-500 mt-1">Güncel klinik durumu</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Aktif Hasta" value={activePatients ?? 0} color="bg-blue-500" href="/panel/patients" />
        <Link href="/panel/patients?status=not_started" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Tedaviye Başlanmayanlar</span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${rc.icon}`}><UserX size={18} className="text-white" /></div>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-gray-900">{notStartedCount}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mb-1 ${rc.badgeBg} ${rc.badgeText}`}>%{notStartedRatio}</span>
          </div>
        </Link>
        <StatCard icon={Bell} label="Açık Uyarı" value={openAlerts ?? 0} color="bg-red-500" href="/panel/alerts" />
        <StatCard icon={MessageSquare} label="Okunmamış Mesaj" value={unreadMsgs ?? 0} color="bg-green-500" href="/panel/messages" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><UserX size={16} className="text-orange-500" />Tedaviye Başlanmayanlar</h2>
          <Link href="/panel/patients?status=not_started" className="text-sm text-indigo-600 hover:underline">Tümünü gör</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {!notStartedList?.length && <div className="flex items-center gap-2 px-5 py-8 text-gray-400 text-sm justify-center"><CheckCircle size={16} className="text-green-400" />Tedaviye başlanmayan hasta yok</div>}
          {notStartedList?.map(patient => {
            const u = (patient.users as any)
            const name = u ? `${u.first_name} ${u.last_name}` : 'İsimsiz'
            return (
              <Link key={patient.id} href={`/panel/patients/${patient.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold flex-shrink-0">{name[0]?.toUpperCase()}</div>
                <div className="flex-1"><p className="text-sm font-medium text-gray-900">{name}</p></div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700 flex-shrink-0">Tedaviye Başlanmadı</span>
              </Link>
            )
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Bell size={16} className="text-red-500" />Açık Uyarılar</h2>
            <Link href="/panel/alerts" className="text-sm text-indigo-600 hover:underline">Tümünü gör</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!recentAlerts?.length && <div className="flex items-center gap-2 px-5 py-8 text-gray-400 text-sm justify-center"><CheckCircle size={16} className="text-green-400" />Açık uyarı yok</div>}
            {recentAlerts?.map(alert => {
              const p = (alert.patients as any)
              const name = p?.users ? `${p.users.first_name} ${p.users.last_name}` : 'Bilinmeyen'
              const sc = alert.severity === 'urgent' ? 'bg-red-100 text-red-700' : alert.severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
              return (
                <div key={alert.id} className="px-5 py-3 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-500 truncate">{alert.message}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${sc}`}>
                    {alert.severity === 'urgent' ? 'Acil' : alert.severity === 'high' ? 'Yüksek' : 'Orta'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><MessageSquare size={16} className="text-blue-500" />Son Mesajlar</h2>
            <Link href="/panel/messages" className="text-sm text-indigo-600 hover:underline">Tümünü gör</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!recentConvs?.length && <div className="flex items-center gap-2 px-5 py-8 text-gray-400 text-sm justify-center"><MessageSquare size={16} />Henüz konuşma yok</div>}
            {recentConvs?.map(conv => {
              const p = (conv.patients as any)
              const name = p?.users ? `${p.users.first_name} ${p.users.last_name}` : 'Hasta'
              return (
                <Link key={conv.id} href="/panel/messages" className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">{name[0]?.toUpperCase()}</div>
                  <div className="flex-1"><p className="text-sm font-medium text-gray-900">{name}</p></div>
                  {conv.last_message_at && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} />{new Date(conv.last_message_at).toLocaleDateString('tr-TR')}</span>}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

