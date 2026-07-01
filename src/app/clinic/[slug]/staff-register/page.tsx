import { getClinicBySlug } from '@/lib/clinics'
import { notFound } from 'next/navigation'
import StaffRegisterForm from '@/components/StaffRegisterForm'

export default async function StaffRegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const clinic = await getClinicBySlug(slug)
  if (!clinic) notFound()

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: 'var(--clinic-secondary)' }}
    >
      <StaffRegisterForm clinicId={clinic.id} />
      <p className="mt-8 text-xs text-gray-400">IVF Companion</p>
    </main>
  )
}