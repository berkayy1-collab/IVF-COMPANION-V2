import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PatientHeader from '@/components/patient/PatientHeader'
import { isMedicationActiveOn, todayStr, daysBetween } from '@/lib/medicationSchedule'

export default async function AppHome() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()

  const { data: patient } = await supabase
    .from('patients')
    .select('id, transfer_date, beta_hcg_date, notes')
    .eq('user_id', user.id)
    .maybeSingle()

  let activeMedCount = 0
  if (patient) {
    const { data: medications } = await supabase
      .from('medications')
      .select('*')
      .eq('patient_id', patient.id)

    const today = todayStr()
    activeMedCount = (medications || []).filter((m: any) =>
      isMedicationActiveOn(m, today, patient.transfer_date)
    ).length
  }

  let transferDayText: string | null = null
  if (patient?.transfer_date) {
    const offset = daysBetween(new Date(patient.transfer_date), new Date())
    if (offset === 0) transferDayText = 'Bugün transfer günü'
    else if (offset > 0) transferDayText = `Transferden bu yana ${offset}. gün`
    else transferDayText = `Transfere ${Math.abs(offset)} gün kaldı`
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <PatientHeader title="IVF Companion" showBack={false} />

      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="rounded-3xl bg-rose-600 p-6 text-white shadow-lg">
          <p className="text-sm text-rose-100">Hoş geldiniz</p>
          <h2 className="mt-1 text-2xl font-bold">
            {profile?.first_name ? `${profile.first_name} ${profile.last_name ?? ''}` : 'Merhaba'}
          </h2>
          {transferDayText ? (
            <span className="mt-4 inline-block rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
              {transferDayText}
            </span>
          ) : (
            <p className="mt-4 text-sm text-rose-100">
              Kliniğiniz transfer bilginizi girince takip süreciniz burada görünecek.
            </p>
          )}
        </div>

        {patient && (
          <Link
            href="/app/ilaclarim"
            className="mt-4 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 hover:ring-rose-200"
          >
            <div>
              <p className="text-sm text-gray-500">Bugünkü ilaçlar</p>
              <p className="text-lg font-bold text-gray-900">
                {activeMedCount > 0 ? `${activeMedCount} ilaç aktif` : 'Bugün için ilaç yok'}
              </p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-400">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
            </svg>
          </Link>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            href="/app/tarihlerim"
            className="flex flex-col items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 hover:ring-rose-200"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3a.75.75 0 0 1 1.5 0v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-gray-900">Tarihlerim</span>
          </Link>

          <Link
            href="/app/ilaclarim"
            className="flex flex-col items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 hover:ring-rose-200"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M8.25 3.75A1.5 1.5 0 0 1 9.75 2.25h4.5a1.5 1.5 0 0 1 1.5 1.5v1.5h.75a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h.75v-1.5Zm1.5 1.5h4.5v-1.5h-4.5v1.5Z" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-gray-900">İlaçlarım</span>
          </Link>

          <Link
            href="/app/notlarim"
            className="col-span-2 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 hover:ring-rose-200"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-gray-900">Klinik Notlarım / Talimatlar</span>
          </Link>
        </div>
      </main>
    </div>
  )
}