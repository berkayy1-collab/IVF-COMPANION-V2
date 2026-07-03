import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import PatientDetail from "@/components/panel/PatientDetail"

export default async function PatientDetailPage({
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

  const [
    { data: patient },
    { data: medications },
    { data: symptomLogs },
    { data: notes },
  ] = await Promise.all([
    supabase.from("patients").select(
      "id, status, started_elsewhere, transfer_date, beta_hcg_date, created_at, user_id, clinic_id, phone, city, date_of_birth, blood_type, allergies, chronic_conditions, previous_ivf_count, embryo_count, emergency_contact_name, emergency_contact_phone, anamnesis_file_url, notes"
    ).eq("id", id).eq("clinic_id", appUser.clinic_id).single(),
    supabase.from("medications").select("*").eq("patient_id", id).order("created_at"),
    supabase.from("symptom_logs").select("*").eq("patient_id", id).order("created_at", { ascending: false }).limit(30),
    supabase.from("clinical_notes").select("id, content, created_at, user_id").eq("patient_id", id).order("created_at", { ascending: false }),
  ])

  if (!patient) redirect("/panel/patients")

  // Fetch patient user info separately
  const { data: patientUser } = await supabase
    .from("users")
    .select("id, first_name, last_name, email")
    .eq("id", patient.user_id)
    .single()

  // Fetch note authors separately
  const noteUserIds = [...new Set((notes || []).map((n: any) => n.user_id).filter(Boolean))]
  let noteUserMap: Record<string, any> = {}
  if (noteUserIds.length > 0) {
    const { data: noteUsers } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .in("id", noteUserIds)
    if (noteUsers) {
      noteUsers.forEach((u: any) => {
        noteUserMap[u.id] = u
      })
    }
  }

  const notesWithAuthors = (notes || []).map((n: any) => ({
    ...n,
    author_name: noteUserMap[n.user_id]
      ? noteUserMap[n.user_id].first_name + " " + noteUserMap[n.user_id].last_name
      : "Klinik",
  }))

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("patient_id", id)
    .maybeSingle()

  let messages: any[] = []
  if (conversation) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at")
      .limit(50)
    messages = msgs || []
  }

  const patientWithUser = {
    ...patient,
    full_name: patientUser
      ? patientUser.first_name + " " + patientUser.last_name
      : "İsimsiz Hasta",
    email: patientUser?.email || "",
  }

  return (
    <PatientDetail
      patient={patientWithUser}
      medications={medications || []}
      symptomLogs={symptomLogs || []}
      clinicalNotes={notesWithAuthors}
      messages={messages}
      conversationId={conversation?.id || null}
      currentUserId={user.id}
    />
  )
}