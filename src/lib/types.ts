export type Clinic = {
  id: string; slug: string; name: string; logo_url: string | null
  primary_color: string; secondary_color: string; qr_code_url: string | null
  is_active: boolean; created_at: string; updated_at: string
}
export type UserRole = 'patient' | 'nurse' | 'doctor' | 'clinic_admin' | 'super_admin'
export type AppUser = {
  id: string; clinic_id: string | null; role: UserRole
  first_name: string; last_name: string; phone: string | null
  email: string; is_active: boolean; created_at: string; updated_at: string
}
export type Patient = {
  id: string; user_id: string; clinic_id: string; date_of_birth: string | null
  transfer_date: string | null; beta_hcg_date: string | null
  assigned_nurse: string | null; assigned_doctor: string | null
  status: 'active' | 'completed' | 'cancelled'; created_at: string; updated_at: string
  users?: { first_name: string; last_name: string; email: string; phone: string | null }
}
export type Medication = {
  id: string; patient_id: string; clinic_id: string; name: string; dosage: string
  times_of_day: string[]; start_day: number; end_day: number; notes: string | null
  is_active: boolean; created_by: string | null; created_at: string; updated_at: string
}
export type Alert = {
  id: string; patient_id: string; clinic_id: string
  type: 'critical_symptom' | 'medication_missed'; source_id: string | null
  message: string; severity: 'medium' | 'high' | 'urgent'
  status: 'open' | 'acknowledged' | 'resolved'
  resolved_by: string | null; resolved_at: string | null; created_at: string
  patients?: { id: string; users?: { first_name: string; last_name: string } }
}
export type Conversation = {
  id: string; patient_id: string; clinic_id: string; assigned_nurse: string | null
  status: 'open' | 'closed'; last_message_at: string | null; created_at: string
  patients?: { id: string; users?: { first_name: string; last_name: string } }
}
export type Message = {
  id: string; conversation_id: string; clinic_id: string; sender_id: string
  sender_role: string; content: string; read_at: string | null; created_at: string
}
export type ClinicalNote = {
  id: string; patient_id: string; clinic_id: string; author_id: string
  note: string; created_at: string; updated_at: string
  users?: { first_name: string; last_name: string }
}
export type SymptomLog = {
  id: string; patient_id: string; clinic_id: string; log_date: string
  day_number: number | null; symptoms: Array<{ code: string; severity: number }>
  overall_feeling: number | null; free_text: string | null
  has_critical: boolean; created_at: string; updated_at: string
}
