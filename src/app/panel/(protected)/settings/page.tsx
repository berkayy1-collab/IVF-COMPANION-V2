import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from '@/components/panel/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/panel/login')

  const { data: appUser } = await supabase
    .from('users')
    .select('clinic_id, role')
    .eq('id', user.id)
    .single()

  if (!appUser?.clinic_id) redirect('/panel/login')
  if (!['clinic_admin', 'super_admin'].includes(appUser.role)) redirect('/panel')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, primary_color, contact_email, contact_phone, address')
    .eq('id', appUser.clinic_id)
    .single()

  if (!clinic) redirect('/panel')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Klinik Ayarlari</h1>
        <p className="text-sm text-gray-500 mt-1">Klinik bilgilerini ve gorünumunu duzenleyin.</p>
      </div>
      <SettingsForm
        clinicId={clinic.id}
        initialName={clinic.name ?? ''}
        initialColor={clinic.primary_color ?? '#e11d48'}
        initialEmail={clinic.contact_email ?? ''}
        initialPhone={clinic.contact_phone ?? ''}
        initialAddress={clinic.address ?? ''}
      />
    </div>
  )
}
