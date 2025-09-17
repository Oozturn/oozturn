export function range(start: number, stop: number, step: number) {
  return Array.from(
    { length: (stop - start) / step + 1 },
    (_, index) => start + index * step
  )
}

export const Days = ["days.dimanche", "days.lundi", "days.mardi", "days.mercredi", "days.jeudi", "days.vendredi", "days.samedi"]
