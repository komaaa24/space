import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — Chatspace",
  description: "Chatspace platformasida ma'lumotlar qanday saqlanishi va ishlatilishi.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="Ushbu sahifa Chatspace foydalanuvchilari va ularning mijozlari ma'lumotlari qanday yig'ilishi, ishlatilishi va himoya qilinishini tushuntiradi."
      updatedAt="21 September 2026"
      sections={[
        {
          title: "1. Qanday ma'lumotlar yig'iladi",
          body: [
            "Chatspace foydalanuvchi akkaunti uchun email, ism, kompaniya nomi, tarif holati va login ma'lumotlarini saqlashi mumkin.",
            "Instagram, Telegram yoki boshqa kanallar ulanganda, kanal identifikatori, username, xabarlar tarixi, mijoz savollari va avtomatlashtirish uchun kerakli texnik tokenlar saqlanishi mumkin.",
          ],
        },
        {
          title: "2. Ma'lumotlardan foydalanish",
          body: [
            "Ma'lumotlar AI javob berishi, inbox ko'rsatishi, leadlarni aniqlashi, avtomatizatsiya ishlashi va mijozlarga xizmat ko'rsatish uchun ishlatiladi.",
            "Chatspace foydalanuvchi biznesiga tegishli ma'lumotlarni boshqa mijozlarga ko'rsatmaydi va sotmaydi.",
          ],
        },
        {
          title: "3. Uchinchi tomon xizmatlari",
          body: [
            "Platforma Instagram, Telegram, Google OAuth, AI provayderlari va to'lov xizmatlari bilan ishlashi mumkin.",
            "Uchinchi tomon API'lariga yuboriladigan ma'lumot faqat xizmatni bajarish uchun zarur bo'lgan minimal hajmda uzatiladi.",
          ],
        },
        {
          title: "4. Xavfsizlik",
          body: [
            "Tokenlar va maxfiy credentiallar server tarafida himoyalangan holda saqlanadi.",
            "Foydalanuvchi sessiyasi, kanal ulanishlari va API so'rovlari ruxsat tekshiruvlari orqali boshqariladi.",
          ],
        },
        {
          title: "5. Ma'lumotlarni o'chirish",
          body: [
            "Foydalanuvchi o'z akkaunti yoki kanal ma'lumotlarini o'chirishni so'rashi mumkin.",
            "Ma'lumotlarni o'chirish bo'yicha tartib /data-deletion sahifasida ko'rsatilgan.",
          ],
        },
        {
          title: "6. Bog'lanish",
          body: [
            "Maxfiylik bo'yicha savollar uchun @chatspacesupport Telegram supportiga murojaat qilishingiz mumkin.",
          ],
        },
      ]}
    />
  );
}
