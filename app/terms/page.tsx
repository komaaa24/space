import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — Chatspace",
  description: "Chatspace xizmatidan foydalanish qoidalari.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description="Ushbu shartlar Chatspace platformasidan foydalanish qoidalari, foydalanuvchi majburiyatlari va xizmat chegaralarini belgilaydi."
      updatedAt="21 September 2026"
      sections={[
        {
          title: "1. Xizmat tavsifi",
          body: [
            "Chatspace Instagram, Telegram va boshqa kanallardagi mijoz xabarlarini bitta panelda boshqarish, AI javoblar va leadlarni avtomatik aniqlash uchun xizmat qiladi.",
            "Xizmat imkoniyatlari foydalanuvchi tanlagan tarif va ulangan integratsiyalarga bog'liq.",
          ],
        },
        {
          title: "2. Foydalanish qoidalari",
          body: [
            "Foydalanuvchi platformadan qonuniy, halol va uchinchi tomon qoidalariga zid bo'lmagan tarzda foydalanishi kerak.",
            "Spam, firibgarlik, noqonuniy kontent, ruxsatsiz ma'lumot yig'ish yoki boshqa shaxslarning huquqlarini buzadigan faoliyat taqiqlanadi.",
          ],
        },
        {
          title: "3. Integratsiyalar",
          body: [
            "Instagram, Telegram, Google yoki to'lov tizimlari bilan ishlash ularning rasmiy API va platforma qoidalariga bog'liq.",
            "Uchinchi tomon servislaridagi cheklov, uzilish yoki siyosat o'zgarishlari Chatspace imkoniyatlariga ta'sir qilishi mumkin.",
          ],
        },
        {
          title: "4. AI javoblar",
          body: [
            "AI javoblar foydalanuvchi bergan bilimlar bazasi, FAQ, katalog va sozlamalar asosida yaratiladi.",
            "Foydalanuvchi AI javoblarini tekshirish, biznesiga mos sozlash va zarur holatda operatorga o'tkazish uchun mas'ul.",
          ],
        },
        {
          title: "5. To'lov va tariflar",
          body: [
            "Tariflar, limitlar va xizmat narxlari Chatspace tomonidan yangilanishi mumkin.",
            "Pullik xizmatlar bo'yicha alohida kelishuv yoki to'lov provayderi shartlari amal qilishi mumkin.",
          ],
        },
        {
          title: "6. Bog'lanish",
          body: [
            "Xizmat shartlari bo'yicha savollar uchun @chatspacesupport Telegram supportiga murojaat qiling.",
          ],
        },
      ]}
    />
  );
}
