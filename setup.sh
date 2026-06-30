#!/usr/bin/env bash
# ============================================================
# IVF Companion — Toplu Kurulum Scripti
# Multi-tenant tema + klinik karsilama + kayit + giris + /app
# Tum dosyalari dogru klasorlere, tek seferde olusturur.
# Kullanim:  bash setup.sh   (proje kokunde calistir)
# ============================================================
set -e

# Proje koku kontrolu
if [ ! -f package.json ]; then
  echo "HATA: package.json bulunamadi. Bu scripti proje kokunde calistir:"
  echo "  cd /workspaces/IVF-COMPANION-V2 && bash setup.sh"
  exit 1
fi

echo "Klasorler olusturuluyor..."
mkdir -p src/lib/supabase
mkdir -p src/components
mkdir -p "src/app/clinic/[slug]/register"
mkdir -p "src/app/clinic/[slug]/login"
mkdir -p src/app/app

echo "src/lib/types.ts"
cat > src/lib/types.ts <<'EOF'
export type Clinic = {
  id: string
  slug: string
  name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  is_active: boolean
}
EOF

echo "src/lib/supabase/client.ts"
cat > src/lib/supabase/client.ts <<'EOF'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
EOF

echo "src/lib/supabase/server.ts"
cat > src/lib/supabase/server.ts <<'EOF'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
EOF

echo "src/lib/clinics.ts"
cat > src/lib/clinics.ts <<'EOF'
import { createClient } from '@/lib/supabase/server'
import type { Clinic } from '@/lib/types'

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
EOF

echo "src/app/clinic/[slug]/layout.tsx"
cat > "src/app/clinic/[slug]/layout.tsx" <<'EOF'
import { getClinicBySlug } from '@/lib/clinics'
import type { CSSProperties } from 'react'

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
EOF

echo "src/app/clinic/[slug]/page.tsx"
cat > "src/app/clinic/[slug]/page.tsx" <<'EOF'
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
EOF

echo "src/app/clinic/[slug]/not-found.tsx"
cat > "src/app/clinic/[slug]/not-found.tsx" <<'EOF'
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
EOF

echo "src/app/clinic/[slug]/register/page.tsx"
cat > "src/app/clinic/[slug]/register/page.tsx" <<'EOF'
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
EOF

echo "src/app/clinic/[slug]/login/page.tsx"
cat > "src/app/clinic/[slug]/login/page.tsx" <<'EOF'
import { getClinicBySlug } from '@/lib/clinics'
import { notFound } from 'next/navigation'
import LoginForm from '@/components/LoginForm'

export default async function LoginPage({
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
      <LoginForm />
      <p className="mt-8 text-xs text-gray-400">IVF Companion</p>
    </main>
  )
}
EOF

echo "src/components/RegisterForm.tsx"
cat > src/components/RegisterForm.tsx <<'EOF'
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterForm({ clinicId }: { clinicId: string }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [kvkk, setKvkk] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!kvkk) {
      setError('Devam etmek icin KVKK onayini isaretleyin.')
      return
    }
    if (password.length < 6) {
      setError('Sifre en az 6 karakter olmalidir.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          clinic_id: clinicId,
          role: 'patient',
          first_name: firstName,
          last_name: lastName,
          phone,
        },
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          &#10003;
        </div>
        <h1 className="mt-6 text-xl font-bold text-gray-900">Kayit basarili!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Hesabiniz olusturuldu. Kliniginiz transfer bilginizi girince uygulamaniz aktiflesecek.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900">Kayit Ol</h1>
      <p className="mt-1 text-sm text-gray-500">Bilgilerinizi girin</p>
      <div className="mt-6 flex flex-col gap-4">
        <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="Ad" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="Soyad" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="Telefon" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="Sifre (en az 6 karakter)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <label className="flex items-start gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} className="mt-0.5" />
          <span>KVKK aydinlatma metnini okudum ve kisisel verilerimin islenmesini onayliyorum.</span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="rounded-xl px-6 py-3 font-semibold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--clinic-primary)' }}>
          {loading ? 'Kaydediliyor...' : 'Kayit Ol'}
        </button>
      </div>
    </form>
  )
}
EOF

echo "src/components/LoginForm.tsx"
cat > src/components/LoginForm.tsx <<'EOF'
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('E-posta veya sifre hatali.')
      return
    }
    router.push('/app')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900">Giris Yap</h1>
      <p className="mt-1 text-sm text-gray-500">Hesabiniza giris yapin</p>
      <div className="mt-6 flex flex-col gap-4">
        <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="rounded-xl border border-gray-300 px-4 py-3" placeholder="Sifre" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="rounded-xl px-6 py-3 font-semibold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--clinic-primary)' }}>
          {loading ? 'Giris yapiliyor...' : 'Giris Yap'}
        </button>
      </div>
    </form>
  )
}
EOF

echo "src/app/app/page.tsx"
cat > src/app/app/page.tsx <<'EOF'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppHome() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">
          Hos geldiniz{profile?.first_name ? `, ${profile.first_name}` : ''}!
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Uygulamaniz hazir. Kliniginiz transfer bilginizi girince takip sureciniz baslayacak.
        </p>
      </div>
      <p className="mt-8 text-xs text-gray-400">IVF Companion</p>
    </main>
  )
}
EOF

echo ""
echo "============================================"
echo "TUM DOSYALAR BASARIYLA OLUSTURULDU."
echo "============================================"