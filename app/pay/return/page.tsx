import { CheckCircle2 } from "lucide-react";

// Click to'lovdan so'ng xaridorni shu sahifaga qaytaradi. Haqiqiy
// tasdiqlash server-server webhook (Complete) orqali bo'ladi — bu sahifa
// shunchaki xaridorga tinchlantiruvchi xabar ko'rsatadi.
export default function PayReturnPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7ff] px-6">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-line p-8 text-center space-y-3">
        <span className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </span>
        <h1 className="font-extrabold text-lg">To'lov qabul qilindi</h1>
        <p className="text-sm text-slate-400">
          Buyurtmangiz tasdiqlangach sotuvchi siz bilan bog'lanadi. Ushbu
          oynani yopishingiz mumkin.
        </p>
      </div>
    </div>
  );
}
