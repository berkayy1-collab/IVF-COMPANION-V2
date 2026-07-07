'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getMedicationDates,
  doseForDay,
  dayLabel,
  formatDateTR,
  todayStr,
} from '@/lib/medicationSchedule'

interface Medication {
  id: string
  name: string
  dosage: string
  route: string | null
  notes: string | null
  times_of_day: string[] | null
  transfer_day_start: number | null
  transfer_day_end: number | null
  start_date: string | null
  end_date: string | null
  daily_doses: { day: number; dose: number }[] | null
}

interface Intake {
  medication_id: string
  dose_date: string
  dose_time: string
}

export default function MedicationCalendar({
  medications,
  intakes,
  transferDate,
  patientId,
  clinicId,
}: {
  medications: Medication[]
  intakes: Intake[]
  transferDate: string | null
  patientId: string
  clinicId: string
}) {
  const supabase = createClient()
  const today = todayStr()

  const [taken, setTaken] = useState<Set<string>>(
    () => new Set(intakes.map((i) => `${i.medication_id}|${i.dose_date}|${i.dose_time}`))
  )
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const useTransferDay = medications.some(
    (m) => m.transfer_day_start != null && m.transfer_day_end != null
  )

  const medRows = useMemo(() => {
    return medications.map((med) => {
      const dates = getMedicationDates(med, transferDate)
      return { med, dates }
    })
  }, [medications, transferDate])

  async function toggle(med: Medication, dateStr: string, time: string) {
    const key = `${med.id}|${dateStr}|${time}`
    if (dateStr > today) return
    setBusyKey(key)

    if (taken.has(key)) {
      const { error } = await supabase
        .from('medication_intakes')
        .delete()
        .eq('medication_id', med.id)
        .eq('dose_date', dateStr)
        .eq('dose_time', time)
      if (!error) {
        setTaken((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }
    } else {
      const { error } = await supabase.from('medication_intakes').insert({
        medication_id: med.id,
        patient_id: patientId,
        clinic_id: clinicId,
        dose_date: dateStr,
        dose_time: time,
      })
      if (!error) {
        setTaken((prev) => new Set(prev).add(key))
      }
    }
    setBusyKey(null)
  }

  if (medications.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
        <p className="text-sm text-gray-400">Şu anda size tanımlı bir ilaç bulunmuyor.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {medRows.map(({ med, dates }) => {
        const times = med.times_of_day && med.times_of_day.length > 0 ? med.times_of_day : ['—']
        return (
          <div key={med.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-bold text-gray-900">{med.name}</h3>
              <span className="text-sm font-medium text-rose-600">{med.dosage}</span>
            </div>
            {med.route && <p className="mt-0.5 text-xs text-gray-400">{med.route}</p>}
            {med.notes && <p className="mt-1 text-xs text-gray-500">{med.notes}</p>}

            {dates.length === 0 ? (
              <p className="mt-3 text-xs text-gray-400">Bu ilaç için tarih aralığı tanımlanmamış.</p>
            ) : (
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {dates.map(({ day, date }) => {
                  const isToday = date === today
                  const isFuture = date > today
                  const dose = doseForDay(med, day)
                  return (
                    <div
                      key={date}
                      className={`rounded-xl border px-3 py-2 ${
                        isToday ? 'border-rose-300 bg-rose-50' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">
                          {formatDateTR(date)} · {dayLabel(day, useTransferDay)}
                        </span>
                        {dose && <span className="text-xs text-gray-500">Doz: {dose}</span>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {times.map((time) => {
                          const key = `${med.id}|${date}|${time}`
                          const isTaken = taken.has(key)
                          const isBusy = busyKey === key
                          return (
                            <button
                              key={time}
                              type="button"
                              disabled={isFuture || isBusy}
                              onClick={() => toggle(med, date, time)}
                              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                                isTaken
                                  ? 'bg-rose-600 text-white'
                                  : isFuture
                                  ? 'cursor-not-allowed bg-gray-100 text-gray-300'
                                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-rose-300'
                              }`}
                            >
                              {isTaken ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                </svg>
                              ) : null}
                              {time}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}