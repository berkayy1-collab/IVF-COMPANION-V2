import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const STAFF = ['nurse', 'doctor', 'clinic_admin', 'super_admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(list) {
          list.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (pathname === '/panel/login') {
    if (user) {
      const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (u && STAFF.includes(u.role)) {
        return NextResponse.redirect(new URL('/panel', request.url))
      }
    }
    return res
  }

  if (!user) return NextResponse.redirect(new URL('/panel/login', request.url))

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!u || !STAFF.includes(u.role)) {
    return NextResponse.redirect(new URL('/panel/login', request.url))
  }

  return res
}

export const config = { matcher: ['/panel/:path*'] }
