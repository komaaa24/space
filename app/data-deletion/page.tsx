import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Data Deletion — Chatspace",
  description: "Chatspace foydalanuvchi ma'lumotlarini o'chirish tartibi.",
};

export default function DataDeletionPage() {
  return (
    <LegalPage
      title="Data Deletion Instructions"
      description="Ushbu sahifa Chatspace akkaunti, integratsiya tokenlari va bog'liq ma'lumotlarni o'chirish tartibini tushuntiradi."
      updatedAt="21 September 2026"
      sections={[
        {
          title: "1. Ma'lumotlarni o'chirish so'rovi",
          body: [
            "Foydalanuvchi Chatspace akkaunti yoki ulangan kanal ma'lumotlarini o'chirishni so'rashi mumkin.",
            "So'rov yuborishda akkaunt emaili, kompaniya nomi va qaysi ma'lumotlarni o'chirish kerakligini ko'rsating.",
          ],
        },
        {
          title: "2. Qayerga murojaat qilinadi",
          body: [
            "Telegram orqali @chatspacesupport ga yozing yoki Chatspace admin panelidagi support havolasi orqali murojaat qiling.",
            "So'rov qabul qilingach, shaxsni tasdiqlash uchun qo'shimcha ma'lumot so'ralishi mumkin.",
          ],
        },
        {
          title: "3. Nimalar o'chiriladi",
          body: [
            "Akkaunt ma'lumotlari, ulangan kanal credentiallari, Instagram yoki Telegram tokenlari, inbox xabarlari, leadlar va biznes sozlamalari o'chirilishi mumkin.",
            "Qonuniy, moliyaviy yoki xavfsizlik sabablari bilan ayrim texnik loglar cheklangan muddat saqlanishi mumkin.",
          ],
        },
        {
          title: "4. Muddat",
          body: [
            "O'chirish so'rovlari odatda 7 ish kuni ichida ko'rib chiqiladi.",
            "Jarayon tugagach foydalanuvchiga tasdiq xabari yuboriladi.",
          ],
        },
        {
          title: "5. Uchinchi tomon ulanishlari",
          body: [
            "Instagram, Telegram yoki Google akkauntingizdagi ruxsatlarni ularning rasmiy account settings bo'limidan ham bekor qilishingiz mumkin.",
          ],
        },
      ]}
    />
  );
}
