import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/panel/Sidebar'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/panel/login')

  const { data: userData } = await supabase.from('users').select('first_name, role, clinic_id').eq('id', user.id).single()
  if (!userData || !['nurse','doctor','clinic_admin','super_admin'].includes(userData.role)) redirect('/panel/login')

  let clinicName = 'Klinik'
  if (userData.clinic_id) {
    const { data: clinic } = await supabase.from('clinics').select('name').eq('id', userData.clinic_id).single()
    if (clinic) clinicName = clinic.name
  }

  const [alertsRes, msgsRes] = await Promise.all([
    supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('messages').select('id', { count: 'exact', head: true }).is('read_at', null).eq('sender_role', 'patient'),
  ])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar firstName={userData.first_name} role={userData.role} clinicName={clinicName} openAlerts={alertsRes.count ?? 0} unreadMessages={msgsRes.count ?? 0} />
      <main className="flex-1 min-w-0"><div className="pt-14 lg:pt-0">{children}</div></main>
    </div>
  )
}
