import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, forbiddenByPlan } from "@/lib/access-control";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
  if (!(await canUseFeature(session.clientId, "catalog"))) {
    return forbiddenByPlan("Katalog faqat VIP tarifda ochiq");
  }

  const { id, variantId } = await params;
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { item: true },
  });
  if (!variant || variant.itemId !== id || variant.item.clientId !== session.clientId) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const data: { stock?: number } = {};
  if (Number.isFinite(body?.stock)) data.stock = Math.max(0, Math.trunc(body.stock));

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Ma'lumot yo'q" }, { status: 400 });
  }

  const updated = await prisma.productVariant.update({ where: { id: variantId }, data });
  return NextResponse.json({ variant: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
  if (!(await canUseFeature(session.clientId, "catalog"))) {
    return forbiddenByPlan("Katalog faqat VIP tarifda ochiq");
  }

  const { id, variantId } = await params;
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { item: true },
  });
  if (!variant || variant.itemId !== id || variant.item.clientId !== session.clientId) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  await prisma.productVariant.delete({ where: { id: variantId } });
  return NextResponse.json({ ok: true });
}
