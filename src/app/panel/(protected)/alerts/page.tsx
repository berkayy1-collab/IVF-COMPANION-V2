import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AlertList from '@/components/panel/AlertList'

export default async function AlertsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/panel/login')

  const { data: appUser } = await supabase
    .from('users')
    .select('clinic_id')
    .eq('id', user.id)
    .single()

  if (!appUser?.clinic_id) redirect('/panel/login')

  const { data: alerts } = await supabase
    .from('alerts')
    .select('id, type, severity, message, status, created_at, resolved_at, patient_id, patients(users(full_name))')
    .eq('clinic_id', appUser.clinic_id)
    .order('created_at', { ascending: false })

  const mapped = (alerts ?? []).map((a: any) => ({
    id: a.id,
    patient_id: a.patient_id,
    patient_name: a.patients?.users?.full_name ?? 'Bilinmeyen',
    type: a.type ?? '',
    severity: a.severity ?? 'medium',
    message: a.message,
    status: a.status,
    created_at: a.created_at,
    resolved_at: a.resolved_at,
  }))

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Uyarilar</h1>
        <p className="text-sm text-gray-500 mt-1">Hasta semptom uyarilarini buradan takip edin.</p>
      </div>
      <AlertList alerts={mapped} />
    </div>
  )
}
