import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PatientHeader from '@/components/patient/PatientHeader'
import MedicationCalendar from '@/components/patient/MedicationCalendar'

export default async function IlaclarimPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: patient } = await supabase
    .from('patients')
    .select('id, clinic_id, transfer_date')
    .eq('user_id', user.id)
    .maybeSingle()

  let medications: any[] = []
  let intakes: any[] = []

  if (patient) {
    const { data: meds } = await supabase
      .from('medications')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('is_active', true)
      .order('created_at')
    medications = meds || []

    if (medications.length > 0) {
      const { data: ints } = await supabase
        .from('medication_intakes')
        .select('medication_id, dose_date, dose_time')
        .in(
          'medication_id',
          medications.map((m) => m.id)
        )
      intakes = ints || []
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <PatientHeader title="İlaçlarım" />

      <main className="mx-auto max-w-lg px-4 py-6">
        {patient ? (
          <MedicationCalendar
            medications={medications}
            intakes={intakes}
            transferDate={patient.transfer_date}
            patientId={patient.id}
            clinicId={patient.clinic_id}
          />
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
            <p className="text-sm text-gray-400">Hasta kaydınız bulunamadı.</p>
          </div>
        )}
      </main>
    </div>
  )
}