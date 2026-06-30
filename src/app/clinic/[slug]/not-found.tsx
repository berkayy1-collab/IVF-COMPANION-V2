import Link from 'next/link'

export default function ClinicNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
          &#128269;
        </div>
        <h1 className="mt-6 text-xl font-bold text-gray-900">Klinik bulunamadi</h1>
        <p className="mt-2 text-sm text-gray-500">
          Aradiginiz klinik mevcut degil veya baglanti hatali olabilir.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-indigo-600">
          Ana sayfaya don
        </Link>
      </div>
      <p className="mt-8 text-xs text-gray-400">IVF Companion</p>
    </main>
  )
}
