import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PatientHeader from '@/components/patient/PatientHeader'
import { daysBetween, formatDateTR } from '@/lib/medicationSchedule'

export default async function TarihlerimPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: patient } = await supabase
    .from('patients')
    .select('transfer_date, beta_hcg_date')
    .eq('user_id', user.id)
    .maybeSingle()

  const transferOffset = patient?.transfer_date
    ? daysBetween(new Date(patient.transfer_date), new Date())
    : null

  const betaOffset = patient?.beta_hcg_date
    ? daysBetween(new Date(), new Date(patient.beta_hcg_date))
    : null

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <PatientHeader title="Tarihlerim" />

      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm font-medium text-gray-500">Transfer Tarihi</p>
          {patient?.transfer_date ? (
            <>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatDateTR(patient.transfer_date)}
              </p>
              <p className="mt-1 text-sm text-rose-600">
                {transferOffset === 0
                  ? 'Bugün transfer günü'
                  : transferOffset! > 0
                  ? `Transferden bu yana ${transferOffset} gün geçti`
                  : `Transfere ${Math.abs(transferOffset!)} gün kaldı`}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-gray-400">
              Klinik henüz transfer tarihinizi girmedi.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm font-medium text-gray-500">Beta HCG Tarihi</p>
          {patient?.beta_hcg_date ? (
            <>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatDateTR(patient.beta_hcg_date)}
              </p>
              <p className="mt-1 text-sm text-rose-600">
                {betaOffset === 0
                  ? 'Bugün beta HCG günü'
                  : betaOffset! > 0
                  ? `Beta HCG'ye ${betaOffset} gün kaldı`
                  : `Beta HCG tarihinden bu yana ${Math.abs(betaOffset!)} gün geçti`}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-gray-400">
              Klinik henüz beta HCG tarihinizi girmedi.
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">
          Bu tarihleri yalnızca klinik personeliniz değiştirebilir. Bir değişiklik gerekiyorsa lütfen kliniğinizle iletişime geçin.
        </p>
      </main>
    </div>
  )
}