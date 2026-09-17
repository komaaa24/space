// Payme Merchant API (Cash Register API) — mijozning OʻZ Payme kassasi orqali
// ishlaydi. Chatspace pul ushlamaydi: bu yerda faqat checkout havolasi
// yaratish va Payme'ning JSON-RPC so'rovlariga (webhook) javob berish bor.
// Rasmiy hujjat: https://developer.help.paycom.uz/

export function buildPaymeCheckoutUrl(params: {
  merchantId: string;
  paymentId: string;
  amountSom: number;
}) {
  const { merchantId, paymentId, amountSom } = params;
  const amountTiyin = Math.round(amountSom * 100);
  const raw = `m=${merchantId};ac.order_id=${paymentId};a=${amountTiyin}`;
  const encoded = Buffer.from(raw, "utf-8").toString("base64");
  return `https://checkout.paycom.uz/${encoded}`;
}

export function checkPaymeAuth(authHeader: string | null, secretKey: string) {
  if (!authHeader?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
  const [login, password] = decoded.split(":");
  return login === "Paycom" && password === secretKey;
}

export const PaymeError = {
  INVALID_AMOUNT: -31001,
  ORDER_NOT_FOUND: -31050,
  CANNOT_PERFORM: -31008,
  TRANSACTION_NOT_FOUND: -31003,
  AUTH_FAILED: -32504,
  METHOD_NOT_FOUND: -32601,
  PARSE_ERROR: -32700,
};

export function jsonRpcResult(id: number | string | null, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

export function jsonRpcError(
  id: number | string | null,
  code: number,
  message: string,
) {
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message: { uz: message, ru: message, en: message } },
  };
}
