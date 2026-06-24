import { getClinicBySlug } from '@/lib/clinics'
import type { CSSProperties } from 'react'

// /clinic/[slug] altindaki tum sayfalari saran katman.
// Klinik renklerini CSS degiskeni olarak aktarir.
// Klinik yoksa cakilmasin diye guvenli varsayilan renkler kullanir;
// "bulunamadi" karari sayfada (page.tsx) verilir.
export default async function ClinicLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const clinic = await getClinicBySlug(slug)

  const themeStyle = {
    '--clinic-primary': clinic?.primary_color ?? '#4F46E5',
    '--clinic-secondary': clinic?.secondary_color ?? '#E0E7FF',
    minHeight: '100vh',
  } as CSSProperties

  return <div style={themeStyle}>{children}</div>
}
