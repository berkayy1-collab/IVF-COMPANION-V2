import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MessageCenter from '@/components/panel/MessageCenter'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/panel/login')

  const { data: appUser } = await supabase
    .from('users')
    .select('clinic_id, full_name')
    .eq('id', user.id)
    .single()

  if (!appUser?.clinic_id) redirect('/panel/login')

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, patient_id, last_message_at, patients(users(full_name))')
    .eq('clinic_id', appUser.clinic_id)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  const convIds = (conversations ?? []).map((c: any) => c.id)
  let unreadMap: Record<string, number> = {}
  if (convIds.length > 0) {
    const { data: unread } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds)
      .eq('sender_role', 'patient')
      .eq('read', false)
    for (const msg of unread ?? []) {
      unreadMap[msg.conversation_id] = (unreadMap[msg.conversation_id] ?? 0) + 1
    }
  }

  const mappedConvs = (conversations ?? []).map((c: any) => ({
    id: c.id,
    patient_id: c.patient_id,
    patient_name: c.patients?.users?.full_name ?? 'Bilinmeyen',
    last_message_at: c.last_message_at,
    unread_count: unreadMap[c.id] ?? 0,
  }))

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Mesajlar</h1>
      </div>
      <MessageCenter
        conversations={mappedConvs}
        currentUserId={user.id}
        currentUserName={appUser.full_name ?? ''}
      />
    </div>
  )
}
