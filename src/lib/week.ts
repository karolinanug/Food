const MONTHS = ["sausio", "vasario", "kovo", "balandžio", "gegužės", "birželio", "liepos", "rugpjūčio", "rugsėjo", "spalio", "lapkričio", "gruodžio"];

export function mondayOf(offsetWeeks: number, today = new Date()): Date {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dow = (d.getDay() + 6) % 7; // pirmadienis = 0
  d.setDate(d.getDate() - dow + offsetWeeks * 7);
  return d;
}

export function weekKey(monday: Date): string {
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${monday.getFullYear()}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function weekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  if (monday.getMonth() === sunday.getMonth()) {
    return `${MONTHS[monday.getMonth()]} ${monday.getDate()}–${sunday.getDate()} d.`;
  }
  return `${MONTHS[monday.getMonth()]} ${monday.getDate()} d. – ${MONTHS[sunday.getMonth()]} ${sunday.getDate()} d.`;
}

export function dayLabel(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()} d.`;
}
