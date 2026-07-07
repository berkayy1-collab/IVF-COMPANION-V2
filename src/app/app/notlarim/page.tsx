import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PatientHeader from '@/components/patient/PatientHeader'

export default async function NotlarimPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: patient } = await supabase
    .from('patients')
    .select('notes')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <PatientHeader title="Klinik Notlarım" />

      <main className="mx-auto max-w-lg px-4 py-6">
        {patient?.notes ? (
          <div className="rounded-2xl bg-amber-50 p-5 shadow-sm ring-1 ring-amber-100">
            <p className="text-sm font-medium text-amber-700">Kliniğinizden Talimatlar</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-amber-900">
              {patient.notes}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
            <p className="text-sm text-gray-400">
              Kliniğiniz henüz sizin için bir not veya talimat eklemedi.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}