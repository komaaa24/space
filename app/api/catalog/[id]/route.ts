import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, forbiddenByPlan } from "@/lib/access-control";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
  if (!(await canUseFeature(session.clientId, "catalog"))) {
    return forbiddenByPlan("Katalog faqat VIP tarifda ochiq");
  }

  const { id } = await params;
  const item = await prisma.catalogItem.findUnique({ where: { id } });
  if (!item || item.clientId !== session.clientId) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const data: { name?: string; price?: string; category?: string; inStock?: boolean } = {};
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body?.price === "string" && body.price.trim()) data.price = body.price.trim();
  if (typeof body?.category === "string" && body.category.trim()) data.category = body.category.trim();
  if (typeof body?.inStock === "boolean") data.inStock = body.inStock;

  const updated = await prisma.catalogItem.update({ where: { id }, data });
  return NextResponse.json({ item: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
  if (!(await canUseFeature(session.clientId, "catalog"))) {
    return forbiddenByPlan("Katalog faqat VIP tarifda ochiq");
  }

  const { id } = await params;
  const item = await prisma.catalogItem.findUnique({ where: { id } });
  if (!item || item.clientId !== session.clientId) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  await prisma.catalogItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
