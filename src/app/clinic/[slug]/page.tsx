import { getClinicBySlug } from '@/lib/clinics'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ClinicWelcomePage({
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
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-lg">
        {clinic.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clinic.logo_url} alt={clinic.name} className="mx-auto h-20 w-20 object-contain" />
        ) : (
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold text-white"
            style={{ backgroundColor: 'var(--clinic-primary)' }}
          >
            {clinic.name.charAt(0)}
          </div>
        )}

        <h1 className="mt-6 text-2xl font-bold text-gray-900">{clinic.name}</h1>
        <p className="mt-2 text-sm text-gray-500">Tup bebek tedavinizde yaninizdayiz</p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/clinic/${clinic.slug}/register`}
            className="rounded-xl px-6 py-3 font-semibold text-white"
            style={{ backgroundColor: 'var(--clinic-primary)' }}
          >
            Kayit Ol
          </Link>
          <Link
            href={`/clinic/${clinic.slug}/login`}
            className="rounded-xl border-2 px-6 py-3 font-semibold"
            style={{ borderColor: 'var(--clinic-primary)', color: 'var(--clinic-primary)' }}
          >
            Giris Yap
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400">IVF Companion</p>
    </main>
  )
}
