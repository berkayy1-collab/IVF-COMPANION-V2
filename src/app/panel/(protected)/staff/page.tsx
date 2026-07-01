import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ROLE_LABELS: Record<string, string> = {
  nurse: 'Hemşire',
  doctor: 'Doktor',
  clinic_admin: 'Klinik Yöneticisi',
  super_admin: 'Süper Admin',
}

const ROLE_STYLE: Record<string, string> = {
  clinic_admin: 'bg-rose-100 text-rose-700',
  super_admin: 'bg-purple-100 text-purple-700',
  doctor: 'bg-blue-100 text-blue-700',
  nurse: 'bg-green-100 text-green-700',
}

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/panel/login')

  const { data: appUser } = await supabase
    .from('users')
    .select('clinic_id, role')
    .eq('id', user.id)
    .single()

  if (!appUser?.clinic_id) redirect('/panel/login')
  if (!['clinic_admin', 'super_admin', 'nurse'].includes(appUser.role)) redirect('/panel')

  const { data: staff } = await supabase
    .from('users')
    .select('id, full_name, email, role, created_at')
    .eq('clinic_id', appUser.clinic_id)
    .in('role', ['nurse', 'doctor', 'clinic_admin', 'super_admin'])
    .order('created_at', { ascending: false })

  const { data: clinicInfo } = await supabase
    .from('clinics')
    .select('slug')
    .eq('id', appUser.clinic_id)
    .single()

  const staffRegisterPath = clinicInfo?.slug ? `/clinic/${clinicInfo.slug}/staff-register` : null

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Personel</h1>
        <p className="text-sm text-gray-500 mt-1">Kliniğe kayıtlı personel listesi.</p>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ad Soyad</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">E-posta</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Kayıt Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {!staff?.length && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-400 text-sm">
                  Personel bulunamadı.
                </td>
              </tr>
            )}
            {(staff ?? []).map((s: any) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{s.full_name ?? '-'}</td>
                <td className="px-4 py-3 text-gray-600">{s.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_STYLE[s.role] ?? 'bg-gray-100 text-gray-700'}`}>
                    {ROLE_LABELS[s.role] ?? s.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(s.created_at).toLocaleDateString('tr-TR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-sm font-semibold text-amber-800 mb-1">Yeni Personel Eklemek İçin</p>
        <p className="text-sm text-amber-700">
          Aşağıdaki adresi, kendi site adresinizin (Codespace linkinizin) sonuna ekleyerek yeni hemşire veya doktorunuzla paylaşın. Formu doldurup kaydolduklarında otomatik olarak personel hesabı açılır ve doğrudan bu listede görünürler.
        </p>
        {staffRegisterPath && (
          <div className="mt-3 bg-white border border-amber-200 rounded-lg px-3 py-2">
            <code className="text-xs text-amber-900 break-all">{staffRegisterPath}</code>
          </div>
        )}
        <p className="mt-2 text-xs text-amber-600">
          Bu linki yalnızca güvendiğiniz kişilerle paylaşın — link üzerinden kayıt olan herkes hemşire/doktor yetkisiyle sisteme erişebilir.
        </p>
      </div>
    </div>
  )
}