import { getClinicBySlug } from '@/lib/clinics'
import { notFound } from 'next/navigation'
import RegisterForm from '@/components/RegisterForm'

export default async function RegisterPage({
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
      <RegisterForm clinicId={clinic.id} />
      <p className="mt-8 text-xs text-gray-400">IVF Companion</p>
    </main>
  )
}
