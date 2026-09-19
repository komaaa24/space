// Render'ning proxy orti ichki host (localhost:10000) req.url'ga sizib
// chiqishi mumkin — shuning uchun tashqi redirect/webhook manzillarini
// har doim shu asosiy manzildan quramiz, req.url'dan emas.
export function getAppBaseUrl() {
  return process.env.APP_BASE_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:3000";
}
