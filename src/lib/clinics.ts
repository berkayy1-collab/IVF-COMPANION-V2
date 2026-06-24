import { createClient } from '@/lib/supabase/server'
import type { Clinic } from '@/lib/types'

// Verilen slug'a sahip AKTİF kliniği veritabanından getirir.
// Klinik bulunamazsa veya pasifse null döner.
export async function getClinicBySlug(slug: string): Promise<Clinic | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clinics')
    .select('id, slug, name, logo_url, primary_color, secondary_color, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return data as Clinic
}
