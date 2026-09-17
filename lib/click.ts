import crypto from "crypto";

// Click Merchant API — mijozning OʻZ Click hisobi orqali ishlaydi. Chatspace
// pul ushlamaydi: faqat checkout havolasi yaratish va Click'ning
// Prepare/Complete webhook so'rovlariga javob berish bor.
// Rasmiy hujjat: https://docs.click.uz/

export function buildClickCheckoutUrl(params: {
  merchantId: string;
  serviceId: string;
  paymentId: string;
  amountSom: number;
  returnUrl: string;
}) {
  const { merchantId, serviceId, paymentId, amountSom, returnUrl } = params;
  const url = new URL("https://my.click.uz/services/pay");
  url.searchParams.set("service_id", serviceId);
  url.searchParams.set("merchant_id", merchantId);
  url.searchParams.set("amount", String(amountSom));
  url.searchParams.set("transaction_param", paymentId);
  url.searchParams.set("return_url", returnUrl);
  return url.toString();
}

export function md5(input: string) {
  return crypto.createHash("md5").update(input).digest("hex");
}

export function verifyClickSignPrepare(params: {
  clickTransId: string;
  serviceId: string;
  secretKey: string;
  merchantTransId: string;
  amount: string;
  action: string;
  signTime: string;
  signString: string;
}) {
  const expected = md5(
    `${params.clickTransId}${params.serviceId}${params.secretKey}${params.merchantTransId}${params.amount}${params.action}${params.signTime}`,
  );
  return expected === params.signString;
}

export function verifyClickSignComplete(params: {
  clickTransId: string;
  serviceId: string;
  secretKey: string;
  merchantTransId: string;
  merchantPrepareId: string;
  amount: string;
  action: string;
  signTime: string;
  signString: string;
}) {
  const expected = md5(
    `${params.clickTransId}${params.serviceId}${params.secretKey}${params.merchantTransId}${params.merchantPrepareId}${params.amount}${params.action}${params.signTime}`,
  );
  return expected === params.signString;
}

export const ClickError = {
  SUCCESS: 0,
  SIGN_FAILED: -1,
  INCORRECT_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  ORDER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  ALREADY_CANCELLED: -9,
};
