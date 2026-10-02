export function normalizePhoneForSearch(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("998")) return digits;
  if (digits.length === 10 && digits.startsWith("8")) return "998" + digits.slice(1);
  if (digits.length === 9) return "998" + digits;
  return digits;
}
