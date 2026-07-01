'use client'
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus, X, RefreshCw } from "lucide-react"
interface Props {
  patientId: string
  clinicId: string
  hasTransferDate?: boolean
  transferDayStart?: number | null
  transferDayEnd?: number | null
}
export default function MedicationForm({ patientId, clinicId, hasTransferDate, transferDayStart, transferDayEnd }: Props) {
  const [name, setName] = useState("")
  const [dose, setDose] = useState("")
  const [route, setRoute] = useState("")
  const [times, setTimes] = useState<string[]>(["08:00"])
  const [useTransferDay, setUseTransferDay] = useState(!!hasTransferDate)
  const [dayStart, setDayStart] = useState(transferDayStart != null ? String(transferDayStart) : "-5")
  const [dayEnd, setDayEnd] = useState(transferDayEnd != null ? String(transferDayEnd) : "14")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [instructions, setInstructions] = useState("")
  // Doz hesaplama
  const [totalDosage, setTotalDosage] = useState("")
  const [treatmentDays, setTreatmentDays] = useState("")
  const [dailyDosage, setDailyDosage] = useState("")
  const [dailyManual, setDailyManual] = useState(false)
  // Gün gün doz planı
  const [dailyDoses, setDailyDoses] = useState<{ day: number; dose: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()
  const supabase = createClient()
  function addTime() { setTimes(t => [...t, "12:00"]) }
  function removeTime(i: number) { setTimes(t => t.filter((_, idx) => idx !== i)) }
  function updateTime(i: number, val: string) { setTimes(t => t.map((v, idx) => idx === i ? val : v)) }
  function dayLabel(n: number) {
    if (n === 0) return "Gün 0 (Transfer)"
    return n > 0 ? `Gün +${n}` : `Gün ${n}`
  }
  function dailyRowLabel(n: number) {
    return useTransferDay ? dayLabel(n) : `${n}. Gün`
  }
  // Transfer günlerinden gün sayısını otomatik hesapla
  function calcDaysFromTransfer() {
    const s = parseInt(dayStart)
    const e = parseInt(dayEnd)
    if (!isNaN(s) && !isNaN(e) && e >= s) {
      const days = e - s + 1
      setTreatmentDays(String(days))
      if (!dailyManual && totalDosage) {
        const total = parseFloat(totalDosage)
        if (!isNaN(total) && days > 0) {
          setDailyDosage((total / days).toFixed(2))
        }
      }
    }
  }
  function handleTotalDosageChange(val: string) {
    setTotalDosage(val)
    if (!dailyManual) {
      const total = parseFloat(val)
      const days = parseInt(treatmentDays)
      if (!isNaN(total) && !isNaN(days) && days > 0) {
        setDailyDosage((total / days).toFixed(2))
      } else {
        setDailyDosage("")
      }
    }
  }
  function handleTreatmentDaysChange(val: string) {
    setTreatmentDays(val)
    setDailyManual(false)
    const total = parseFloat(totalDosage)
    const days = parseInt(val)
    if (!isNaN(total) && !isNaN(days) && days > 0) {
      setDailyDosage((total / days).toFixed(2))
    } else {
      setDailyDosage("")
    }
  }
  function handleDailyDosageChange(val: string) {
    setDailyDosage(val)
    setDailyManual(true)
  }
  // Gün gün doz planı oluşturma / güncelleme
  function getDayList(): number[] {
    if (useTransferDay) {
      const s = parseInt(dayStart)
      const e = parseInt(dayEnd)
      if (isNaN(s) || isNaN(e) || e < s) return []
      const list: number[] = []
      for (let d = s; d <= e; d++) list.push(d)
      return list
    } else {
      const days = parseInt(treatmentDays)
      if (isNaN(days) || days < 1) return []
      return Array.from({ length: days }, (_, i) => i + 1)
    }
  }
  function buildDailyPlan() {
    const dayList = getDayList()
    if (dayList.length === 0) {
      setMessage("Günlük plan oluşturmak için önce gün aralığını / tedavi süresini girin.")
      return
    }
    const avg = dailyDosage
      ? parseFloat(dailyDosage)
      : (totalDosage && dayList.length ? parseFloat(totalDosage) / dayList.length : null)
    setDailyDoses(prev => {
      const prevMap = new Map(prev.map(p => [p.day, p.dose]))
      return dayList.map(d => ({
        day: d,
        dose: prevMap.has(d) ? (prevMap.get(d) as string) : (avg != null && !isNaN(avg) ? avg.toFixed(2) : "")
      }))
    })
    setMessage("")
  }
  function updateDailyDose(day: number, val: string) {
    setDailyDoses(prev => prev.map(p => p.day === day ? { ...p, dose: val } : p))
  }
  function resetDailyDosesToAverage() {
    const avg = dailyDosage
      ? parseFloat(dailyDosage)
      : (totalDosage && dailyDoses.length ? parseFloat(totalDosage) / dailyDoses.length : null)
    if (avg == null || isNaN(avg)) return
    setDailyDoses(prev => prev.map(p => ({ ...p, dose: avg.toFixed(2) })))
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setMessage("İlaç adı zorunludur."); return }
    setLoading(true)
    setMessage("")
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const payload: any = {
      patient_id: patientId,
      clinic_id: clinicId,
      created_by: authUser?.id ?? null,
      name: name.trim(),
      dosage: dose.trim() || null,
      route: route.trim() || null,
      times_of_day: times.filter(Boolean),
      notes: instructions.trim() || null,
      is_active: true,
      total_dosage: totalDosage ? parseFloat(totalDosage) : null,
      treatment_days: treatmentDays ? parseInt(treatmentDays) : null,
      daily_dosage: dailyDosage ? parseFloat(dailyDosage) : null,
    }
    if (dailyDoses.length > 0) {
      const cleaned = dailyDoses
        .filter(d => d.dose !== "" && !isNaN(parseFloat(d.dose)))
        .map(d => ({ day: d.day, dose: parseFloat(d.dose) }))
      if (cleaned.length > 0) {
        payload.daily_doses = cleaned
      }
    }
    if (useTransferDay) {
      payload.transfer_day_start = parseInt(dayStart)
      payload.transfer_day_end = parseInt(dayEnd)
    } else {
      payload.start_date = startDate || null
      payload.end_date = endDate || null
    }
    const { error } = await supabase.from("medications").insert(payload)
    setLoading(false)
    if (error) {
      setMessage("Hata: " + error.message)
    } else {
      router.push(`/panel/patients/${patientId}`)
      router.refresh()
    }
  }
  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">İlaç Adı *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ör. Progesteron" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Birim Doz</label>
          <input type="text" value={dose} onChange={e => setDose(e.target.value)} placeholder="ör. 200mg, 1500 IU" className={inputCls} />
          <p className="text-xs text-gray-400 mt-1">Tek kullanımdaki doz miktarı</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Uygulama Yolu</label>
          <input type="text" value={route} onChange={e => setRoute(e.target.value)} placeholder="Vajinal, Oral, SC..." className={inputCls} />
        </div>
      </div>
      {/* Doz Hesaplama Bölümü */}
      <div className="border-2 border-rose-100 rounded-xl p-4 bg-rose-50/30 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Toplam Doz Hesaplama</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Toplam Doz</label>
            <input
              type="number"
              value={totalDosage}
              onChange={e => handleTotalDosageChange(e.target.value)}
              placeholder="ör. 3000"
              className={inputCls}
            />
            <p className="text-xs text-gray-400 mt-1">IU, mg, ml...</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Tedavi Süresi (Gün)
              {useTransferDay && (
                <button
                  type="button"
                  onClick={calcDaysFromTransfer}
                  className="ml-2 text-rose-600 underline text-xs"
                >
                  Transfer günlerinden doldur
                </button>
              )}
            </label>
            <input
              type="number"
              value={treatmentDays}
              onChange={e => handleTreatmentDaysChange(e.target.value)}
              placeholder="ör. 10"
              className={inputCls}
            />
          </div>
        </div>
        {/* Günlük Doz (ortalama) */}
        <div className="bg-white rounded-lg border border-rose-200 p-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-700">Günlük Doz (Ortalama)</label>
            {dailyManual && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Manuel düzenlendi</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={dailyDosage}
              onChange={e => handleDailyDosageChange(e.target.value)}
              placeholder="Otomatik hesaplanır"
              className={inputCls}
            />
            {dailyManual && (
              <button
                type="button"
                onClick={() => {
                  setDailyManual(false)
                  const total = parseFloat(totalDosage)
                  const days = parseInt(treatmentDays)
                  if (!isNaN(total) && !isNaN(days) && days > 0) {
                    setDailyDosage((total / days).toFixed(2))
                  }
                }}
                className="text-xs text-rose-600 hover:underline whitespace-nowrap"
              >
                Sıfırla
              </button>
            )}
          </div>
          {totalDosage && treatmentDays && !dailyManual && (
            <p className="text-xs text-rose-600 mt-1 font-medium">
              {totalDosage} ÷ {treatmentDays} gün = <strong>{dailyDosage}</strong> / gün
            </p>
          )}
          {dailyManual && totalDosage && treatmentDays && (
            <p className="text-xs text-amber-600 mt-1">
              Otomatik: {(parseFloat(totalDosage) / parseInt(treatmentDays)).toFixed(2)} → Manuel: {dailyDosage}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Bu alan sadece genel ortalamayı gösterir. Aşağıdan her günün dozunu ayrı ayrı belirleyebilirsin.
          </p>
        </div>
        {/* Gün Gün Doz Planı */}
        <div className="bg-white rounded-lg border border-rose-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-700">Gün Gün Doz Planı</label>
            <div className="flex items-center gap-3">
              {dailyDoses.length > 0 && (
                <button
                  type="button"
                  onClick={resetDailyDosesToAverage}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Tümünü ortalamaya sıfırla
                </button>
              )}
              <button
                type="button"
                onClick={buildDailyPlan}
                className="flex items-center gap-1 text-xs bg-rose-600 text-white px-3 py-1.5 rounded-lg hover:bg-rose-700"
              >
                <RefreshCw className="w-3 h-3" />
                {dailyDoses.length > 0 ? "Planı Güncelle" : "Günlük Planı Oluştur"}
              </button>
            </div>
          </div>
          {dailyDoses.length === 0 ? (
            <p className="text-xs text-gray-400">
              Önce gün aralığını (Transfer Gününe Göre / Tedavi Süresi) belirle, sonra "Günlük Planı Oluştur" butonuna bas.
              Her gün için ayrı ayrı doz girebileceksin.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {dailyDoses.map(d => (
                <div key={d.day} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-xs font-medium text-gray-600">{dailyRowLabel(d.day)}</span>
                  <input
                    type="number"
                    value={d.dose}
                    onChange={e => updateDailyDose(d.day, e.target.value)}
                    placeholder="Doz"
                    className="flex-1 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Not: Gün aralığını değiştirip "Planı Güncelle" dersen, daha önce elle girdiğin değerler korunur; sadece yeni günler eklenir/çıkarılır.
          </p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Kullanım Saatleri</label>
        <div className="space-y-2">
          {times.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="time" value={t} onChange={e => updateTime(i, e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
              {times.length > 1 && (
                <button type="button" onClick={() => removeTime(i)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addTime} className="mt-2 flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700">
          <Plus className="w-4 h-4" /> Saat Ekle
        </button>
      </div>
      <div className="border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Sürelendirme</label>
          <div className="flex rounded-lg border overflow-hidden text-xs">
            <button type="button" onClick={() => setUseTransferDay(true)}
              className={`px-3 py-1.5 transition-colors ${useTransferDay ? "bg-rose-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              Transfer Gününe Göre
            </button>
            <button type="button" onClick={() => setUseTransferDay(false)}
              className={`px-3 py-1.5 transition-colors ${!useTransferDay ? "bg-rose-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              Takvim Tarihi
            </button>
          </div>
        </div>
        {useTransferDay ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Başlangıç Günü</label>
                <input type="number" value={dayStart} onChange={e => setDayStart(e.target.value)} className={inputCls} placeholder="-5" />
                {dayStart !== "" && <p className="text-xs text-rose-600 mt-1">{dayLabel(parseInt(dayStart) || 0)}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bitiş Günü</label>
                <input type="number" value={dayEnd} onChange={e => setDayEnd(e.target.value)} className={inputCls} placeholder="14" />
                {dayEnd !== "" && <p className="text-xs text-rose-600 mt-1">{dayLabel(parseInt(dayEnd) || 0)}</p>}
              </div>
            </div>
            <p className="text-xs text-gray-400">0 = transfer günü, negatif = öncesi, pozitif = sonrası</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Başlangıç Tarihi</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bitiş Tarihi</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kullanım Talimatı</label>
        <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
          rows={3} placeholder="Hastaya gösterilecek açıklama..." className={inputCls} />
      </div>
      {message && (
        <p className={`text-sm ${message.startsWith("Hata") ? "text-red-600" : "text-green-600"}`}>{message}</p>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-rose-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50">
          {loading ? "Ekleniyor..." : "İlaç Ekle"}
        </button>
        <button type="button" onClick={() => router.back()} className="border px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
          İptal
        </button>
      </div>
    </form>
  )
}
