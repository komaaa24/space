import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyClickSignPrepare,
  verifyClickSignComplete,
  ClickError,
} from "@/lib/click";
import { decryptCredential } from "@/lib/credentials";

async function readFields(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    return Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]));
  }
  const form = await req.formData();
  return Object.fromEntries(Array.from(form.entries()).map(([k, v]) => [k, String(v)]));
}

function clickResponse(fields: Record<string, string>, extra: Record<string, unknown>) {
  return NextResponse.json({
    click_trans_id: fields.click_trans_id,
    merchant_trans_id: fields.merchant_trans_id,
    ...extra,
  });
}

export async function POST(req: Request) {
  const fields = await readFields(req);
  const action = fields.action;

  const integration = fields.service_id
    ? await prisma.paymentIntegration.findFirst({
        where: { provider: "CLICK", serviceId: fields.service_id },
      })
    : null;

  if (!integration) {
    return clickResponse(fields, { error: ClickError.ORDER_NOT_FOUND, error_note: "Merchant topilmadi" });
  }

  try {
  if (action === "0") {
      const secretKey = decryptCredential(integration.secretKey) ?? integration.secretKey;
      // Prepare
      const validSign = verifyClickSignPrepare({
        clickTransId: fields.click_trans_id,
        serviceId: fields.service_id,
        secretKey,
        merchantTransId: fields.merchant_trans_id,
        amount: fields.amount,
        action: fields.action,
        signTime: fields.sign_time,
        signString: fields.sign_string,
      });
      if (!validSign) {
        return clickResponse(fields, { error: ClickError.SIGN_FAILED, error_note: "Imzo xato" });
      }

      const payment = await prisma.payment.findUnique({
        where: { id: fields.merchant_trans_id },
      });
      if (!payment || payment.integrationId !== integration.id) {
        return clickResponse(fields, { error: ClickError.ORDER_NOT_FOUND, error_note: "Buyurtma topilmadi" });
      }
      if (Math.abs(payment.amount - Number(fields.amount)) > 0.01) {
        return clickResponse(fields, { error: ClickError.INCORRECT_AMOUNT, error_note: "Summa mos kelmadi" });
      }
      if (payment.status === "PAID") {
        return clickResponse(fields, { error: ClickError.ALREADY_PAID, error_note: "Allaqachon to'langan" });
      }
      if (payment.status === "CANCELLED") {
        return clickResponse(fields, { error: ClickError.ACTION_NOT_FOUND, error_note: "Bekor qilingan" });
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerTxId: fields.click_trans_id },
      });

      return clickResponse(fields, {
        merchant_prepare_id: payment.id,
        error: ClickError.SUCCESS,
        error_note: "Success",
      });
    }

    if (action === "1") {
      const secretKey = decryptCredential(integration.secretKey) ?? integration.secretKey;
      // Complete
      const validSign = verifyClickSignComplete({
        clickTransId: fields.click_trans_id,
        serviceId: fields.service_id,
        secretKey,
        merchantTransId: fields.merchant_trans_id,
        merchantPrepareId: fields.merchant_prepare_id,
        amount: fields.amount,
        action: fields.action,
        signTime: fields.sign_time,
        signString: fields.sign_string,
      });
      if (!validSign) {
        return clickResponse(fields, { error: ClickError.SIGN_FAILED, error_note: "Imzo xato" });
      }

      const payment = await prisma.payment.findUnique({
        where: { id: fields.merchant_prepare_id },
      });
      if (!payment || payment.integrationId !== integration.id) {
        return clickResponse(fields, { error: ClickError.TRANSACTION_NOT_FOUND, error_note: "Tranzaksiya topilmadi" });
      }

      if (Number(fields.error) < 0) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "CANCELLED" },
        });
        return clickResponse(fields, {
          merchant_confirm_id: payment.id,
          error: ClickError.SUCCESS,
          error_note: "Cancelled",
        });
      }

      if (payment.status !== "PAID") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "PAID", paidAt: new Date() },
        });
      }

      return clickResponse(fields, {
        merchant_confirm_id: payment.id,
        error: ClickError.SUCCESS,
        error_note: "Success",
      });
    }

    return clickResponse(fields, { error: ClickError.ACTION_NOT_FOUND, error_note: "Noma'lum amal" });
  } catch (err) {
    console.error("Click webhook xatosi:", err);
    return clickResponse(fields, { error: ClickError.ACTION_NOT_FOUND, error_note: "Ichki xatolik" });
  }
}
