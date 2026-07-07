// İlaç takvimi için tarih/gün hesaplama yardımcı fonksiyonları

export function daysBetween(a: Date, b: Date): number {
  const ms = 86400000
  const da = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const db = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((db - da) / ms)
}

export function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Bir ilacın belirli bir tarihte aktif olup olmadığını hesaplar
export function isMedicationActiveOn(med: any, dateStr: string, transferDate: string | null): boolean {
  if (med.transfer_day_start != null && med.transfer_day_end != null && transferDate) {
    const offset = daysBetween(new Date(transferDate), new Date(dateStr))
    return offset >= med.transfer_day_start && offset <= med.transfer_day_end
  }
  if (med.start_date && med.end_date) {
    return dateStr >= med.start_date && dateStr <= med.end_date
  }
  if (med.start_date && !med.end_date) {
    return dateStr >= med.start_date
  }
  // Tarih bilgisi hiç girilmemişse her zaman aktif kabul edilir
  return true
}

// İlacın gün numarasını (Gün +N veya N. Gün) belirli bir tarih için hesaplar
export function dayNumberFor(med: any, dateStr: string, transferDate: string | null): number | null {
  if (med.transfer_day_start != null && transferDate) {
    return daysBetween(new Date(transferDate), new Date(dateStr))
  }
  if (med.start_date) {
    return daysBetween(new Date(med.start_date), new Date(dateStr)) + 1
  }
  return null
}

// Gün gün doz planından (varsa) o günün doz miktarını bulur
export function doseForDay(med: any, dayNumber: number | null): string | null {
  if (dayNumber == null || !med.daily_doses) return null
  const entry = (med.daily_doses as any[]).find(d => d.day === dayNumber)
  return entry ? String(entry.dose) : null
}

export function dayLabel(n: number, useTransferDay: boolean): string {
  if (useTransferDay) {
    if (n === 0) return 'Gün 0 (Transfer)'
    return n > 0 ? `Gün +${n}` : `Gün ${n}`
  }
  return `${n}. Gün`
}

// Bir ilacın tüm aktif olduğu (gün, tarih) listesini üretir
export function getMedicationDates(med: any, transferDate: string | null): { day: number; date: string }[] {
  const result: { day: number; date: string }[] = []

  if (med.transfer_day_start != null && med.transfer_day_end != null && transferDate) {
    const base = new Date(transferDate)
    for (let d = med.transfer_day_start; d <= med.transfer_day_end; d++) {
      const dt = new Date(base)
      dt.setDate(dt.getDate() + d)
      const y = dt.getFullYear()
      const m = String(dt.getMonth() + 1).padStart(2, '0')
      const day = String(dt.getDate()).padStart(2, '0')
      result.push({ day: d, date: `${y}-${m}-${day}` })
    }
    return result
  }

  if (med.start_date && med.end_date) {
    const start = new Date(med.start_date)
    const end = new Date(med.end_date)
    let dayNum = 1
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      const y = dt.getFullYear()
      const m = String(dt.getMonth() + 1).padStart(2, '0')
      const day = String(dt.getDate()).padStart(2, '0')
      result.push({ day: dayNum, date: `${y}-${m}-${day}` })
      dayNum++
    }
    return result
  }

  return result
}

export function formatDateTR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}