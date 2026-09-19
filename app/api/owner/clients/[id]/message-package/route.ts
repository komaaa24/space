import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const rawLimit = body?.messageMonthlyLimit;
  const messageMonthlyLimit =
    rawLimit === null || rawLimit === "" || rawLimit === undefined
      ? null
      : Number(rawLimit);
  const messagePackagePrice = Math.max(0, Number(body?.messagePackagePrice ?? 0));
  const messagePackageCurrency =
    typeof body?.messagePackageCurrency === "string"
      ? body.messagePackageCurrency.trim().toUpperCase().slice(0, 8) || "USD"
      : "USD";
  const messagePackageNote =
    typeof body?.messagePackageNote === "string"
      ? body.messagePackageNote.trim().slice(0, 300)
      : "";

  if (
    messageMonthlyLimit !== null &&
    (!Number.isInteger(messageMonthlyLimit) || messageMonthlyLimit < 0)
  ) {
    return NextResponse.json(
      { error: "Xabar limiti noto'g'ri" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(messagePackagePrice)) {
    return NextResponse.json(
      { error: "Paket narxi noto'g'ri" },
      { status: 400 },
    );
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      messageMonthlyLimit,
      messagePackagePrice,
      messagePackageCurrency,
      messagePackageNote,
    },
  });

  return NextResponse.json({ client });
}
