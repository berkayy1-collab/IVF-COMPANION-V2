import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const params = await searchParams
  const q = params.q ?? ""
  const sf = params.status ?? "all"
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div>Giriş yapınız</div>

  const { data: appUser } = await supabase
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .single()

  if (!appUser?.clinic_id) return <div>Klinik bulunamadı</div>

  let query = supabase
    .from("patients")
    .select("id, transfer_date, status, created_at, user_id")
    .eq("clinic_id", appUser.clinic_id)
    .order("created_at", { ascending: false })

  if (sf !== "all") query = query.eq("status", sf)

  const { data: patientsRaw, error } = await query

  const userIds = (patientsRaw || []).map((p: any) => p.user_id).filter(Boolean)
  let userMap: Record<string, any> = {}
  if (userIds.length > 0) {
    const { data: usersData } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role")
      .in("id", userIds)
    if (usersData) {
      usersData.forEach((u: any) => { userMap[u.id] = u })
    }
  }

  // Personel hesapları (nurse, doctor, clinic_admin, super_admin) yanlışlıkla
  // hasta kayıt linkinden geçmiş olsa bile Hastalar listesinde görünmesin.
  const patients = (patientsRaw || []).filter((p: any) => {
    const role = userMap[p.user_id]?.role
    return !role || role === "patient"
  })

  const filtered = (patients || []).filter((p: any) => {
    if (!q) return true
    const u = userMap[p.user_id]
    const name = u ? (u.first_name + " " + u.last_name).toLowerCase() : ""
    const email = (u?.email || "").toLowerCase()
    return name.includes(q.toLowerCase()) || email.includes(q.toLowerCase())
  })

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  }
  const statusLabels: Record<string, string> = {
    active: "Aktif",
    completed: "Tamamlandı",
    cancelled: "İptal",
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hastalar</h1>
        <Link
          href="/panel/patients/new"
          className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700"
        >
          + Yeni Hasta
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        {["all", "active", "completed", "cancelled"].map(s => (
          <Link
            key={s}
            href={`/panel/patients?status=${s}${q ? "&q=" + q : ""}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
              sf === s
                ? "bg-rose-600 text-white border-rose-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-rose-300"
            }`}
          >
            {s === "all" ? "Tümü" : s === "active" ? "Aktif" : s === "completed" ? "Tamamlandı" : "İptal"}
          </Link>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          Hata: {error.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">Hasta bulunamadı</p>
            <p className="text-sm mt-1 text-gray-400">Toplam sorgu: {patients?.length ?? 0} | Klinik: {appUser.clinic_id}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hasta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kayıt</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((patient: any) => {
                const u = userMap[patient.user_id]
                const name = u ? u.first_name + " " + u.last_name : "İsimsiz"
                const email = u?.email || "-"
                return (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{name}</div>
                      <div className="text-sm text-gray-500">{email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={"px-2 py-1 rounded-full text-xs font-medium " + (statusColors[patient.status] || "bg-gray-100 text-gray-600")}>
                        {statusLabels[patient.status] || patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {patient.transfer_date ? new Date(patient.transfer_date).toLocaleDateString("tr-TR") : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(patient.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={"/panel/patients/" + patient.id} className="text-rose-600 hover:text-rose-700 text-sm font-medium">
                        Detay →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}