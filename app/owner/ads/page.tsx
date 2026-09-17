import { CheckCircle2 } from "lucide-react";
import { PageTitle } from "@/components/ui";

export default function OwnerAdsPage() {
  return (
    <div className="space-y-5">
      <PageTitle
        title="Reklama"
        subtitle="Platforma uchun lead manbalari"
      />

      <div className="rounded-2xl bg-white border border-line p-6 max-w-2xl">
        <div className="font-bold text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4.5 h-4.5 text-electric-500" />
          Landing formasi ulangan
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          chatspace.uz saytidagi "Bepul demo" formasi leadlari avtomatik
          "Leadlar" bo'limiga tushmoqda.
        </p>
      </div>
    </div>
  );
}
