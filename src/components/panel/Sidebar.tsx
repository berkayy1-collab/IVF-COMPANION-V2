'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, MessageSquare, Bell, Settings, UserCog, LogOut, Menu, X, Stethoscope } from 'lucide-react'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Props = { firstName: string; role: string; clinicName: string; openAlerts: number; unreadMessages: number }

export default function Sidebar({ firstName, role, clinicName, openAlerts, unreadMessages }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const isAdmin = ['clinic_admin','super_admin'].includes(role)
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/panel/login')
    router.refresh()
  }

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href)

  const nav = [
    { href: '/panel', label: 'Gösterge Paneli', icon: LayoutDashboard, exact: true, badge: 0 },
    { href: '/panel/patients', label: 'Hastalar', icon: Users, badge: 0 },
    { href: '/panel/messages', label: 'Mesajlar', icon: MessageSquare, badge: unreadMessages },
    { href: '/panel/alerts', label: 'Uyarılar', icon: Bell, badge: openAlerts },
  ]
  const adminNav = [
    { href: '/panel/settings', label: 'Ayarlar', icon: Settings },
    { href: '/panel/staff', label: 'Personel', icon: UserCog },
  ]

  const Content = () => (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
        <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <Stethoscope size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{clinicName}</p>
          <p className="text-xs text-gray-400">Klinik Paneli</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
              <item.icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && <span className="text-xs rounded-full px-1.5 py-0.5 font-bold bg-red-500">{item.badge}</span>}
            </Link>
          )
        })}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3"><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Yönetim</p></div>
            {adminNav.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                <item.icon size={18} /><span>{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>
      <div className="px-3 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold flex-shrink-0">{firstName[0]?.toUpperCase()}</div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{firstName}</p>
            <p className="text-xs text-gray-400">{role === 'clinic_admin' ? 'Klinik Yöneticisi' : role === 'doctor' ? 'Doktor' : role === 'nurse' ? 'Hemşire' : role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
          <LogOut size={16} /><span>Çıkış Yap</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="lg:hidden flex items-center justify-between bg-gray-900 text-white px-4 py-3 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2"><Stethoscope size={18} className="text-indigo-400" /><span className="font-semibold text-sm">{clinicName}</span></div>
        <button onClick={() => setOpen(!open)} className="p-1">{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="w-64 h-full"><Content /></div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}
      <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 h-screen sticky top-0"><Content /></aside>
    </>
  )
}
