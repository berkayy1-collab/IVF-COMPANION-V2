import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import MedicationForm from "@/components/panel/MedicationForm"

export default async function MedicationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/panel/login")

  const { data: appUser } = await supabase
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .single()

  if (!appUser?.clinic_id) redirect("/panel/login")

  const { data: patient } = await supabase
    .from("patients")
    .select("id, user_id, clinic_id, transfer_date")
    .eq("id", id)
    .eq("clinic_id", appUser.clinic_id)
    .single()

  if (!patient) redirect("/panel/patients")

  const { data: patientUser } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", patient.user_id)
    .single()

  const patientName = patientUser
    ? patientUser.first_name + " " + patientUser.last_name
    : ""

  const { data: medications } = await supabase
    .from("medications")
    .select("id, name, dosage, route, times_of_day, start_date, end_date, transfer_day_start, transfer_day_end")
    .eq("patient_id", id)
    .order("created_at", { ascending: false })

  function dayLabel(n: number) {
    if (n === 0) return "Gun 0"
    return n > 0 ? "Gun +" + n : "Gun " + n
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Ilac Ekle</h1>
        <p className="text-sm text-gray-500 mt-1">{patientName}</p>
      </div>
      {medications && medications.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Mevcut Ilaclar</h2>
          <div className="space-y-2">
            {medications.map((med: any) => (
              <div key={med.id} className="bg-white border rounded-lg px-4 py-3">
                <p className="font-medium text-sm text-gray-900">{med.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {med.dosage && <span>{med.dosage} · </span>}
                  {med.route && <span>{med.route} · </span>}
                  {med.transfer_day_start != null
                    ? <span>{dayLabel(med.transfer_day_start)} → {dayLabel(med.transfer_day_end)}</span>
                    : <span>{med.start_date} → {med.end_date}</span>
                  }
                  {med.times_of_day?.length > 0 && <span> · {med.times_of_day.join(", ")}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      <MedicationForm patientId={id} clinicId={appUser.clinic_id} hasTransferDate={!!patient.transfer_date} />
    </div>
  )
}
