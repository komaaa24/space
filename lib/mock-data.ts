// Chatspace mock data — backend ulanmaguncha barcha sahifalar shu ma'lumotlar bilan ishlaydi.

export type Channel = "instagram" | "telegram" | "telegram_bot" | "youtube";

export const channelMeta: Record<
  Channel,
  { label: string; color: string; bg: string }
> = {
  instagram: { label: "Instagram", color: "#E1306C", bg: "#fdf2f8" },
  telegram: { label: "Telegram", color: "#229ED9", bg: "#eff6ff" },
  telegram_bot: { label: "Telegram-bot", color: "#229ED9", bg: "#eff6ff" },
  youtube: { label: "YouTube", color: "#FF0000", bg: "#fef2f2" },
};

export interface Message {
  id: string;
  from: "client" | "ai" | "operator";
  text: string;
  time: string;
}

export interface Dialog {
  id: string;
  name: string;
  handle: string;
  channel: Channel;
  lastMessage: string;
  time: string;
  unread: number;
  status: "answered" | "waiting" | "no_reply";
  messages: Message[];
}

export const dialogs: Dialog[] = [
  {
    id: "d1",
    name: "Sardor",
    handle: "@sardor_uz",
    channel: "instagram",
    lastMessage: "Narxi qancha? Yetkazib berish bormi?",
    time: "2 soat",
    unread: 1,
    status: "waiting",
    messages: [
      { id: "m1", from: "client", text: "Assalomu alaykum! Mahsulotingiz haqida ma'lumot bera olasizmi?", time: "14:02" },
      { id: "m2", from: "ai", text: "Vaalaykum assalom! Albatta 😊 Bizda Valvoline avtomobil moylarining to'liq assortimenti bor. Qaysi avtomobil uchun qidiryapsiz?", time: "14:02" },
      { id: "m3", from: "client", text: "Malibu 2 uchun. Narxi qancha? Yetkazib berish bormi?", time: "14:05" },
    ],
  },
  {
    id: "d2",
    name: "Oygul Meliboyeva",
    handle: "@oygul_meliboyeva",
    channel: "instagram",
    lastMessage: "6 mln qilamizmi? 😄",
    time: "2 soat",
    unread: 1,
    status: "no_reply",
    messages: [
      { id: "m1", from: "client", text: "6 mln qilamizmi? 😄", time: "13:40" },
    ],
  },
  {
    id: "d3",
    name: "Ulmas Aliyev",
    handle: "@ulmas_aliyev",
    channel: "telegram",
    lastMessage: "Manzilingiz qayerda joylashgan? Toshkentdami?",
    time: "3 soat",
    unread: 0,
    status: "answered",
    messages: [
      { id: "m1", from: "client", text: "Manzilingiz qayerda joylashgan? Toshkentdami?", time: "12:15" },
      { id: "m2", from: "ai", text: "Ha, biz Toshkent shahrida joylashganmiz: Chilonzor tumani, Bunyodkor ko'chasi 12. Mo'ljal: Mega Planet yonida. Xaritada ko'rish: maps.app/chatspace", time: "12:15" },
    ],
  },
  {
    id: "d4",
    name: "Diktorlik xizmati",
    handle: "@diktorlik_xizmati",
    channel: "instagram",
    lastMessage: "Ovozlashtirgan ishlarimiz bilan telegramdan tanishing",
    time: "2 kun",
    unread: 0,
    status: "answered",
    messages: [
      { id: "m1", from: "client", text: "Ovozlashtirgan ishlarimiz bilan telegramdan tanishing", time: "Juma" },
    ],
  },
  {
    id: "d5",
    name: "Avazbek",
    handle: "@moychi_avazbek",
    channel: "telegram_bot",
    lastMessage: "Katalogni yuboring iltimos",
    time: "4 soat",
    unread: 0,
    status: "answered",
    messages: [
      { id: "m1", from: "client", text: "Katalogni yuboring iltimos", time: "11:20" },
      { id: "m2", from: "ai", text: "Marhamat, to'liq katalogimiz: chatspace.uz/katalog.pdf 📄 Sizni qaysi turdagi mahsulot qiziqtiryapti?", time: "11:20" },
    ],
  },
];

export type RequestCategory = "lead" | "interested" | "complaint" | "suggestion";

export const requestCategoryMeta: Record<
  RequestCategory,
  { label: string; color: string }
> = {
  lead: { label: "Leadlar", color: "#10b981" },
  interested: { label: "Qiziqish bildirganlar", color: "#3b82f6" },
  complaint: { label: "Shikoyatlar", color: "#ef4444" },
  suggestion: { label: "Takliflar", color: "#f59e0b" },
};

export interface Request {
  id: string;
  category: RequestCategory;
  name: string;
  phone?: string;
  channel: Channel;
  text: string;
  date: string;
  status: "new" | "in_progress" | "done";
}

export const requests: Request[] = [
  { id: "r1", category: "lead", name: "Sardor", phone: "+998 99 920 10 11", channel: "instagram", text: "Malibu 2 uchun moy kerak, narxini so'radi, raqamini qoldirdi", date: "Bugun, 14:05", status: "new" },
  { id: "r2", category: "lead", name: "Jasur Toshpo'latov", phone: "+998 90 123 45 67", channel: "telegram", text: "Optom narxlar bilan qiziqdi, 50 dona buyurtma bermoqchi", date: "Bugun, 11:30", status: "in_progress" },
  { id: "r3", category: "interested", name: "Oygul Meliboyeva", channel: "instagram", text: "Aksiya narxlari bilan qiziqdi, hali raqam qoldirmadi", date: "Kecha, 18:22", status: "new" },
  { id: "r4", category: "complaint", name: "Bekzod", phone: "+998 93 555 44 33", channel: "instagram", text: "Yetkazib berish 2 kun kechikkan, qaytarib berishni so'ramoqda", date: "Kecha, 16:10", status: "in_progress" },
  { id: "r5", category: "suggestion", name: "Madina", channel: "telegram", text: "Filtrlar assortimentini ham qo'shishni taklif qildi", date: "3 iyul", status: "done" },
  { id: "r6", category: "lead", name: "Avazbek", phone: "+998 97 700 80 90", channel: "telegram_bot", text: "Katalogdan 2 ta mahsulot tanladi, buyurtma rasmiylashtirmoqchi", date: "3 iyul", status: "done" },
];

export const weeklyDialogs = [
  { day: "Du", count: 2 },
  { day: "Se", count: 3 },
  { day: "Cho", count: 5 },
  { day: "Pa", count: 3 },
  { day: "Ju", count: 9 },
  { day: "Sha", count: 7 },
  { day: "Ya", count: 9 },
];

export const messageVolume7d = [4, 8, 12, 9, 22, 18, 31];
export const messageVolume30d = [
  6, 4, 9, 11, 8, 14, 12, 10, 16, 13, 9, 18, 15, 21, 17, 14, 19, 23, 16, 20,
  25, 18, 22, 27, 19, 24, 29, 21, 26, 31,
];

export const intents = [
  { name: "salomlashish", count: 34 },
  { name: "narx_sorash", count: 28 },
  { name: "katalog_sorash", count: 19 },
  { name: "buyurtma", count: 12 },
  { name: "manzil_sorash", count: 9 },
];

export const popularQuestions = [
  { q: "Narxi qancha?", count: 28 },
  { q: "Yetkazib berish bormi?", count: 17 },
  { q: "Manzilingiz qayerda?", count: 12 },
  { q: "Optom narx bormi?", count: 8 },
];

export interface ConnectedChannel {
  id: string;
  channel: Channel;
  handle: string;
  status: "online" | "expiring" | "error";
  tokenDays: number;
  autoReply: boolean;
}

export const connectedChannels: ConnectedChannel[] = [
  { id: "c1", channel: "instagram", handle: "@valvoline_uzbekistan", status: "online", tokenDays: 58, autoReply: true },
  { id: "c2", channel: "telegram_bot", handle: "@valvoline_uz_bot", status: "online", tokenDays: 999, autoReply: true },
];

export interface KnowledgeItem {
  id: string;
  type: "text" | "link" | "file";
  title: string;
  preview: string;
  addedAt: string;
}

export const knowledgeItems: KnowledgeItem[] = [
  { id: "k1", type: "text", title: "Kompaniya haqida", preview: "Valvoline Uzbekistan — avtomobil moylari bo'yicha rasmiy distribyutor. 2015-yildan beri...", addedAt: "1 iyul" },
  { id: "k2", type: "link", title: "Mahsulotlar katalogi", preview: "https://valvoline.uz/katalog", addedAt: "1 iyul" },
  { id: "k3", type: "file", title: "Narxlar ro'yxati.pdf", preview: "PDF · 2.4 MB", addedAt: "2 iyul" },
  { id: "k4", type: "text", title: "Yetkazib berish shartlari", preview: "Toshkent bo'ylab 1 kun ichida bepul yetkazib beramiz. Viloyatlarga BTS pochta orqali...", addedAt: "3 iyul" },
];

export const faqs = [
  { id: "f1", q: "Narxlaringiz qanday?", a: "Valvoline 5W-30 sintetik moy — 280 000 so'm (4L). To'liq narxlar katalogda: valvoline.uz/katalog" },
  { id: "f2", q: "Yetkazib berish qancha vaqt oladi?", a: "Toshkent bo'ylab 1 kun ichida bepul. Viloyatlarga BTS orqali 2-3 kun, narxi 30 000 so'mdan." },
  { id: "f3", q: "Mahsulot originalligiga kafolat bormi?", a: "Ha, biz rasmiy distribyutormiz. Har bir mahsulotda QR-kod orqali tekshirish imkoni bor." },
];

export const scenarios = [
  { id: "s1", name: "Narx so'ralganda", trigger: "keywords", keywords: "narx, qancha, price, сколько", action: "auto_reply", active: true },
  { id: "s2", name: "Shikoyat kelganda operatorga", trigger: "keywords", keywords: "shikoyat, qaytarish, yomon", action: "to_operator", active: true },
];

export const integrationCatalog = [
  { id: "amocrm", name: "amoCRM", desc: "Arizalar voronkaga tushadi, agent mijoz bosqichini ko'radi", connected: false },
  { id: "bitrix", name: "Bitrix24", desc: "Leadlar avtomatik CRM'ga uzatiladi", connected: false },
  { id: "payme", name: "Payme", desc: "To'lov havolalarini chat ichida yuborish", connected: false },
  { id: "click", name: "Click", desc: "To'lov havolalarini chat ichida yuborish", connected: false },
];

export const tariffs = [
  { id: "free", name: "FREE", price: "0", yearlyPrice: "0", period: "oy", features: ["Instagram Automation: 200 dialog/oy", "AI Agent yopiq", "Katalog yopiq"], current: false },
  { id: "pro", name: "PRO", price: "75 000", yearlyPrice: "50 000", period: "oy", features: ["Instagram Automation cheksiz", "Yillik to'lovda -33%", "AI Agent yopiq", "Katalog yopiq"], current: true },
  { id: "vip", name: "VIP", price: "300 000", yearlyPrice: "225 000", period: "oy", features: ["Instagram Automation cheksiz", "AI Agent ochiq", "Katalog ochiq", "Yillik to'lovda -25%"], current: false },
];

export interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  emoji: string;
  sentCount: number;
  inStock: boolean;
}

export const products: Product[] = [
  { id: "pr1", name: "Valvoline 5W-30 Sintetik (4L)", price: "280 000", category: "Motor moylari", emoji: "🛢️", sentCount: 43, inStock: true },
  { id: "pr2", name: "Valvoline 10W-40 Yarim sintetik (4L)", price: "195 000", category: "Motor moylari", emoji: "🛢️", sentCount: 31, inStock: true },
  { id: "pr3", name: "Valvoline 75W-90 Transmissiya (1L)", price: "120 000", category: "Transmissiya", emoji: "⚙️", sentCount: 12, inStock: true },
  { id: "pr4", name: "Antifriz G12+ qizil (5L)", price: "145 000", category: "Sovutish", emoji: "🧊", sentCount: 8, inStock: false },
  { id: "pr5", name: "Moy filtri (Malibu, Cobalt)", price: "65 000", category: "Filtrlar", emoji: "🔩", sentCount: 19, inStock: true },
  { id: "pr6", name: "Havo filtri (Nexia, Spark)", price: "48 000", category: "Filtrlar", emoji: "💨", sentCount: 7, inStock: true },
];
