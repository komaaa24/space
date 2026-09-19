import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPaymeAuth, jsonRpcResult, jsonRpcError, PaymeError } from "@/lib/payme";
import { decryptCredential } from "@/lib/credentials";

interface RpcRequest {
  id: number | string | null;
  method: string;
  params?: {
    id?: string;
    amount?: number;
    account?: { order_id?: string };
    reason?: number;
    from?: number;
    to?: number;
  };
}

function paymeState(status: string, hadPaidBefore: boolean) {
  if (status === "PAID") return 2;
  if (status === "CANCELLED") return hadPaidBefore ? -2 : -1;
  return 1;
}

export async function POST(req: Request) {
  const body: RpcRequest | null = await req.json().catch(() => null);
  if (!body?.method) {
    return NextResponse.json(jsonRpcError(null, PaymeError.PARSE_ERROR, "Parse error"));
  }

  const authHeader = req.headers.get("authorization");
  // Basic Paycom:<secretKey> — parolni ajratib olib, o'sha kalitga ega
  // integratsiyani (mijozni) shu orqali aniqlaymiz.
  const decoded = authHeader?.startsWith("Basic ")
    ? Buffer.from(authHeader.slice(6), "base64").toString("utf-8")
    : "";
  const secretKey = decoded.split(":")[1] ?? "";

  const integrations = secretKey
    ? await prisma.paymentIntegration.findMany({ where: { provider: "PAYME", active: true } })
    : [];
  const integration =
    integrations.find((item) => (decryptCredential(item.secretKey) ?? item.secretKey) === secretKey) ??
    null;

  const integrationSecret = integration
    ? (decryptCredential(integration.secretKey) ?? integration.secretKey)
    : "";

  if (!integration || !checkPaymeAuth(authHeader, integrationSecret)) {
    return NextResponse.json(
      jsonRpcError(body.id, PaymeError.AUTH_FAILED, "Autentifikatsiya xato"),
    );
  }

  const { method, params } = body;

  try {
    switch (method) {
      case "CheckPerformTransaction": {
        const orderId = params?.account?.order_id;
        const payment = orderId
          ? await prisma.payment.findUnique({ where: { id: orderId } })
          : null;
        if (!payment || payment.integrationId !== integration.id) {
          return NextResponse.json(
            jsonRpcError(body.id, PaymeError.ORDER_NOT_FOUND, "Buyurtma topilmadi"),
          );
        }
        if (Math.round(payment.amount * 100) !== params?.amount) {
          return NextResponse.json(
            jsonRpcError(body.id, PaymeError.INVALID_AMOUNT, "Summa mos kelmadi"),
          );
        }
        if (payment.status !== "PENDING") {
          return NextResponse.json(
            jsonRpcError(body.id, PaymeError.CANNOT_PERFORM, "Buyurtma allaqachon yakunlangan"),
          );
        }
        return NextResponse.json(jsonRpcResult(body.id, { allow: true }));
      }

      case "CreateTransaction": {
        const orderId = params?.account?.order_id;
        const payment = orderId
          ? await prisma.payment.findUnique({ where: { id: orderId } })
          : null;
        if (!payment || payment.integrationId !== integration.id) {
          return NextResponse.json(
            jsonRpcError(body.id, PaymeError.ORDER_NOT_FOUND, "Buyurtma topilmadi"),
          );
        }
        if (payment.providerTxId && payment.providerTxId !== params?.id) {
          return NextResponse.json(
            jsonRpcError(body.id, PaymeError.CANNOT_PERFORM, "Boshqa tranzaksiya mavjud"),
          );
        }
        if (payment.status !== "PENDING") {
          return NextResponse.json(
            jsonRpcError(body.id, PaymeError.CANNOT_PERFORM, "Buyurtma allaqachon yakunlangan"),
          );
        }
        if (!payment.providerTxId) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { providerTxId: String(params?.id) },
          });
        }
        return NextResponse.json(
          jsonRpcResult(body.id, {
            create_time: payment.createdAt.getTime(),
            transaction: payment.id,
            state: 1,
          }),
        );
      }

      case "PerformTransaction": {
        const payment = await prisma.payment.findFirst({
          where: { providerTxId: params?.id, integrationId: integration.id },
        });
        if (!payment) {
          return NextResponse.json(
            jsonRpcError(body.id, PaymeError.TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi"),
          );
        }
        if (payment.status === "CANCELLED") {
          return NextResponse.json(
            jsonRpcError(body.id, PaymeError.CANNOT_PERFORM, "Tranzaksiya bekor qilingan"),
          );
        }
        const paidAt =
          payment.status === "PAID" ? payment.paidAt! : new Date();
        if (payment.status !== "PAID") {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "PAID", paidAt },
          });
        }
        return NextResponse.json(
          jsonRpcResult(body.id, {
            transaction: payment.id,
            perform_time: paidAt.getTime(),
            state: 2,
          }),
        );
      }

      case "CancelTransaction": {
        const payment = await prisma.payment.findFirst({
          where: { providerTxId: params?.id, integrationId: integration.id },
        });
        if (!payment) {
          return NextResponse.json(
            jsonRpcError(body.id, PaymeError.TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi"),
          );
        }
        const wasPaid = payment.status === "PAID";
        if (payment.status !== "CANCELLED") {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "CANCELLED" },
          });
        }
        return NextResponse.json(
          jsonRpcResult(body.id, {
            transaction: payment.id,
            cancel_time: Date.now(),
            state: wasPaid ? -2 : -1,
          }),
        );
      }

      case "CheckTransaction": {
        const payment = await prisma.payment.findFirst({
          where: { providerTxId: params?.id, integrationId: integration.id },
        });
        if (!payment) {
          return NextResponse.json(
            jsonRpcError(body.id, PaymeError.TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi"),
          );
        }
        return NextResponse.json(
          jsonRpcResult(body.id, {
            create_time: payment.createdAt.getTime(),
            perform_time: payment.paidAt?.getTime() ?? 0,
            cancel_time: payment.status === "CANCELLED" ? Date.now() : 0,
            transaction: payment.id,
            state: paymeState(payment.status, !!payment.paidAt),
            reason: null,
          }),
        );
      }

      case "GetStatement": {
        const from = params?.from ? new Date(params.from) : new Date(0);
        const to = params?.to ? new Date(params.to) : new Date();
        const payments = await prisma.payment.findMany({
          where: {
            integrationId: integration.id,
            createdAt: { gte: from, lte: to },
            providerTxId: { not: null },
          },
        });
        return NextResponse.json(
          jsonRpcResult(body.id, {
            transactions: payments.map((p) => ({
              id: p.providerTxId,
              time: p.createdAt.getTime(),
              amount: Math.round(p.amount * 100),
              account: { order_id: p.id },
              create_time: p.createdAt.getTime(),
              perform_time: p.paidAt?.getTime() ?? 0,
              cancel_time: p.status === "CANCELLED" ? p.createdAt.getTime() : 0,
              transaction: p.id,
              state: paymeState(p.status, !!p.paidAt),
              reason: null,
            })),
          }),
        );
      }

      default:
        return NextResponse.json(
          jsonRpcError(body.id, PaymeError.METHOD_NOT_FOUND, "Metod topilmadi"),
        );
    }
  } catch (err) {
    console.error("Payme webhook xatosi:", err);
    return NextResponse.json(
      jsonRpcError(body.id, PaymeError.CANNOT_PERFORM, "Ichki xatolik"),
    );
  }
}
