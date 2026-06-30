'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'

interface Conversation {
  id: string
  patient_id: string
  patient_name: string
  last_message_at: string | null
  unread_count?: number
}

interface Message {
  id: string
  body: string
  sender_id: string
  sender_role: string
  created_at: string
}

interface Props {
  conversations: Conversation[]
  currentUserId: string
  currentUserName: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Az once'
  if (min < 60) return `${min} dk once`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} sa once`
  return `${Math.floor(hr / 24)} gun once`
}

export default function MessageCenter({ conversations, currentUserId, currentUserName }: Props) {
  const [selected, setSelected] = useState<Conversation | null>(conversations[0] ?? null)
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  async function loadMessages(convId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('id, body, sender_id, sender_role, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!selected) return
    loadMessages(selected.id)
    const channel = supabase
      .channel(`msg-center:${selected.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selected.id}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selected?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || !selected || sending) return
    setSending(true)
    await supabase.from('messages').insert({
      conversation_id: selected.id,
      sender_id: currentUserId,
      sender_role: 'staff',
      body: body.trim(),
    })
    await supabase.from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', selected.id)
    setBody('')
    setSending(false)
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl border overflow-hidden">
      <div className="w-72 border-r flex flex-col flex-shrink-0">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900 text-sm">Konusmalar</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-sm text-gray-400 text-center mt-8 px-4">Henuz konusma yok.</p>
          )}
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelected(conv)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b transition-colors ${
                selected?.id === conv.id ? 'bg-rose-50 border-l-2 border-l-rose-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">{conv.patient_name}</p>
                {(conv.unread_count ?? 0) > 0 && (
                  <span className="bg-rose-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1 flex-shrink-0">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              {conv.last_message_at && (
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(conv.last_message_at)}</p>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Bir konusma secin
          </div>
        ) : (
          <>
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-medium text-gray-900 text-sm">{selected.patient_name}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading && <p className="text-center text-sm text-gray-400">Yukleniyor...</p>}
              {messages.map(msg => {
                const isStaff = msg.sender_role !== 'patient'
                return (
                  <div key={msg.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                      isStaff
                        ? 'bg-rose-500 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                    }`}>
                      <p>{msg.body}</p>
                      <p className={`text-xs mt-1 ${isStaff ? 'text-rose-200' : 'text-gray-400'}`}>
                        {timeAgo(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
              <input
                type="text"
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Mesaj yazin..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="bg-rose-600 text-white p-2 rounded-lg hover:bg-rose-700 disabled:opacity-50 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
