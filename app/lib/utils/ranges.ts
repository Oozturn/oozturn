export function range(start: number, stop: number, step: number){
  return Array.from(
    {length: (stop - start) / step + 1},
    (value, index) => start + index * step
  );
}

export const Days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
