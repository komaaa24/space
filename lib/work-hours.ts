const TIMEZONE = "Asia/Tashkent";

// "09:00" / "21:00" formatidagi vaqtlarni hozirgi O'zbekiston vaqti bilan
// solishtiradi. Kecha yarmidan o'tuvchi oraliqlar (masalan 22:00-06:00) ham
// to'g'ri ishlaydi.
export function isWithinWorkHours(start: string, end: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const nowMinutes = hour * 60 + minute;

  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes === endMinutes) return true; // 24/7 deb belgilangan
  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  // Kecha yarmidan o'tadi (masalan 22:00 - 06:00)
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}
