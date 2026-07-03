'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function createPatient(formData: FormData) {
  const firstName = String(formData.get('firstName') || '').trim()
  const lastName = String(formData.get('lastName') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  if (!firstName || !lastName || !email) {
    return { error: 'Lütfen ad, soyad ve e-posta alanlarını doldurun.' }
  }
  if (password.length < 6) {
    return { error: 'Şifre en az 6 karakter olmalıdır.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Oturumunuz bulunamadı, lütfen tekrar giriş yapın.' }
  }

  const { data: appUser } = await supabase
    .from('users')
    .select('clinic_id, role')
    .eq('id', user.id)
    .single()

  if (!appUser?.clinic_id || !['nurse', 'doctor', 'clinic_admin', 'super_admin'].includes(appUser.role)) {
    return { error: 'Bu işlemi yapmak için yetkiniz yok.' }
  }

  const admin = createAdminClient()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      clinic_id: appUser.clinic_id,
      role: 'patient',
      first_name: firstName,
      last_name: lastName,
      phone,
    },
  })

  if (createError || !created?.user) {
    const msg = createError?.message ?? 'bilinmeyen hata'
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
      return { error: 'Bu e-posta adresi zaten kayıtlı.' }
    }
    return { error: 'Hasta oluşturulamadı: ' + msg }
  }

  const newUserId = created.user.id

  // public.users satırı tetikleyici (trigger) ile otomatik oluşmuş olabilir, kontrol et
  const { data: existingAppUser } = await admin
    .from('users')
    .select('id')
    .eq('id', newUserId)
    .maybeSingle()

  if (!existingAppUser) {
    const { error: userInsertError } = await admin.from('users').insert({
      id: newUserId,
      clinic_id: appUser.clinic_id,
      role: 'patient',
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      email,
    })
    if (userInsertError) {
      return { error: 'Kullanıcı hesabı oluşturuldu ama profil kaydı eklenemedi: ' + userInsertError.message }
    }
  }

  // public.patients satırı tetikleyici ile otomatik oluşmuş olabilir, kontrol et
  const { data: existingPatient } = await admin
    .from('patients')
    .select('id')
    .eq('user_id', newUserId)
    .maybeSingle()

  let patientId = existingPatient?.id

  if (!existingPatient) {
    const { data: newPatient, error: patientError } = await admin
      .from('patients')
      .insert({
        user_id: newUserId,
        clinic_id: appUser.clinic_id,
        status: 'not_started',
        started_elsewhere: false,
      })
      .select('id')
      .single()

    if (patientError || !newPatient) {
      return { error: 'Kullanıcı oluşturuldu ama hasta kaydı eklenemedi: ' + (patientError?.message ?? '') }
    }
    patientId = newPatient.id
  }

  redirect(`/panel/patients/${patientId}`)
}