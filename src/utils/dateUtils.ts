export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0]; // HH:mm:ss
}

export function formatDatePretty(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime12h(timeStr?: string | null): string {
  if (!timeStr) return '--:--';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  return `${hours}:${minutes} ${ampm}`;
}

export function calculateWorkingDays(startDateStr: string, endDateStr: string, isHalfDay: boolean = false): number {
  if (!startDateStr || !endDateStr) return 0;
  if (isHalfDay) return 0.5;

  const [sY, sM, sD] = startDateStr.split('-').map(Number);
  const [eY, eM, eD] = endDateStr.split('-').map(Number);
  const start = new Date(sY, sM - 1, sD);
  const end = new Date(eY, eM - 1, eD);

  if (start > end) return 0;

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    // 0 is Sunday, 6 is Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m, s] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  return h * 60 + m + (s ? s / 60 : 0);
}

export function calculateDurationMinutes(
  clockIn: string,
  clockOut?: string | null,
  breaks: Array<{ startTime: string; endTime?: string | null }> = []
): number {
  if (!clockIn) return 0;
  const inMins = parseTimeToMinutes(clockIn);
  const outMins = clockOut ? parseTimeToMinutes(clockOut) : parseTimeToMinutes(getCurrentTimeString());
  let grossMins = Math.max(0, outMins - inMins);

  let breakMins = 0;
  for (const b of breaks) {
    const bStart = parseTimeToMinutes(b.startTime);
    const bEnd = b.endTime ? parseTimeToMinutes(b.endTime) : parseTimeToMinutes(getCurrentTimeString());
    breakMins += Math.max(0, bEnd - bStart);
  }

  return Math.max(0, Math.floor(grossMins - breakMins));
}

export function formatMinutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function datesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA <= endB && endA >= startB;
}
