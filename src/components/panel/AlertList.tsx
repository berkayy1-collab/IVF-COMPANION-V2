'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface Alert {
  id: string
  patient_id: string
  patient_name: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  status: 'open' | 'resolved'
  created_at: string
  resolved_at: string | null
}

interface Props { alerts: Alert[] }

const SEV_STYLE = {
  critical: 'bg-red-50 border-red-200',
  high: 'bg-orange-50 border-orange-200',
  medium: 'bg-yellow-50 border-yellow-200',
  low: 'bg-blue-50 border-blue-200',
}
const SEV_ICON = {
  critical: 'text-red-600',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-blue-500',
}
const SEV_BADGE = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
}
const SEV_LABEL = { critical: 'Kritik', high: 'Yuksek', medium: 'Orta', low: 'Dusuk' }

function timeAgo(d: string) {
  const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (min < 1) return 'Az once'
  if (min < 60) return `${min} dk once`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} sa once`
  return new Date(d).toLocaleDateString('tr-TR')
}

export default function AlertList({ alerts: initial }: Props) {
  const [alerts, setAlerts] = useState(initial)
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open')
  const [resolving, setResolving] = useState<string | null>(null)
  const supabase = createClient()

  const filtered = alerts.filter(a =>
    filter === 'all' ? true : a.status === filter
  )

  async function resolve(id: string) {
    setResolving(id)
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) {
      setAlerts(prev => prev.map(a =>
        a.id === id ? { ...a, status: 'resolved' as const, resolved_at: new Date().toISOString() } : a
      ))
    }
    setResolving(null)
  }

  const openCount = alerts.filter(a => a.status === 'open').length

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(['open', 'resolved', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'open' ? 'Acik' : f === 'resolved' ? 'Cozuldu' : 'Tumü'}
            {f === 'open' && openCount > 0 && (
              <span className="ml-1.5 bg-white text-rose-600 text-xs rounded-full px-1.5 py-0.5">
                {openCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Bu filtrede uyari yok.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(alert => (
          <div
            key={alert.id}
            className={`border rounded-xl p-4 ${SEV_STYLE[alert.severity]} ${
              alert.status === 'resolved' ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${SEV_ICON[alert.severity]}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900">{alert.patient_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEV_BADGE[alert.severity]}`}>
                      {SEV_LABEL[alert.severity]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(alert.created_at)}
                    {alert.resolved_at && ` · Cozuldu: ${timeAgo(alert.resolved_at)}`}
                  </p>
                </div>
              </div>
              {alert.status === 'open' && (
                <button
                  onClick={() => resolve(alert.id)}
                  disabled={resolving === alert.id}
                  className="flex-shrink-0 flex items-center gap-1.5 bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  {resolving === alert.id ? 'Isleniyor...' : 'Cozuldu'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
