import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import PatientProfileForm from "@/components/panel/PatientProfileForm"

export default async function ProfilePage({
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
    .select(
      "id, user_id, clinic_id, phone, city, date_of_birth, blood_type, allergies, chronic_conditions, previous_ivf_count, embryo_count, emergency_contact_name, emergency_contact_phone, anamnesis_file_url, notes"
    )
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Hasta Profili</h1>
        <p className="text-sm text-gray-500 mt-1">{patientName}</p>
      </div>
      <PatientProfileForm patient={patient} patientName={patientName} />
    </div>
  )
}
