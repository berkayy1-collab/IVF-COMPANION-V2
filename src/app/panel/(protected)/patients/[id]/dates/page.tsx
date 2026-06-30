import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DateForm from '@/components/panel/DateForm'

export default async function DatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/panel/login')

  const { data: patient } = await supabase
    .from('patients')
    .select('id, transfer_date, beta_hcg_date, users(full_name)')
    .eq('id', id)
    .single()

  if (!patient) redirect('/panel/patients')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Tarih Düzenle</h1>
        <p className="text-sm text-gray-500 mt-1">{(patient.users as any)?.full_name}</p>
      </div>
      <DateForm
        patientId={patient.id}
        currentTransferDate={patient.transfer_date}
        currentBetaDate={patient.beta_hcg_date}
      />
    </div>
  )
}
