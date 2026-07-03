import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewPatientForm from '@/components/panel/NewPatientForm'

export default async function NewPatientPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/panel/login')

  const { data: appUser } = await supabase
    .from('users')
    .select('clinic_id, role')
    .eq('id', user.id)
    .single()

  if (!appUser?.clinic_id) redirect('/panel/login')
  if (!['nurse', 'doctor', 'clinic_admin', 'super_admin'].includes(appUser.role)) redirect('/panel')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Yeni Hasta Ekle</h1>
        <p className="text-sm text-gray-500 mt-1">
          Hasta için bir giriş hesabı oluşturun. Oluşturduktan sonra hastanın profiline gidip diğer bilgileri (transfer tarihi, kan grubu, vb.) girebilirsiniz.
        </p>
      </div>
      <NewPatientForm />
    </div>
  )
}