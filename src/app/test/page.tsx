import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinics')
    .select('name, slug, primary_color')
    .eq('slug', 'demo-klinik')
    .single()

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Supabase Baglanti Testi</h1>
      {error && <p style={{ color: 'crimson' }}>Hata: {error.message}</p>}
      {data && (
        <div style={{ marginTop: 16, lineHeight: 1.8 }}>
          <p>Baglanti basarili! Veritabanindan veri geldi:</p>
          <p>Klinik adi: <b>{data.name}</b></p>
          <p>Slug: <code>{data.slug}</code></p>
          <p>Tema rengi: <span style={{ color: data.primary_color }}>{data.primary_color}</span></p>
        </div>
      )}
    </div>
  )
}
