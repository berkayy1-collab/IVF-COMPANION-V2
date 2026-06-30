import { createClient } from "@/lib/supabase/server"

export default async function JwtDebugPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  let claims: any = null
  if (session?.access_token) {
    const payload = session.access_token.split(".")[1]
    const decoded = Buffer.from(payload, "base64").toString("utf-8")
    claims = JSON.parse(decoded)
  }

  return (
    <div className="p-8 font-mono text-xs">
      <h1 className="text-lg font-bold mb-4">JWT Debug</h1>
      <pre>{JSON.stringify(claims, null, 2)}</pre>
    </div>
  )
}
