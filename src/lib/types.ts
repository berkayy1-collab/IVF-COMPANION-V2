// Bir kliniğin veri yapısı (clinics tablosundaki alanlarla eşleşir)
export type Clinic = {
  id: string
  slug: string
  name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  is_active: boolean
}
