import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, forbiddenByPlan } from "@/lib/access-control";

interface AttributePair {
  name: string;
  value: string;
}

function parseAttributes(input: unknown): AttributePair[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((a) => ({
      name: typeof a?.name === "string" ? a.name.trim() : "",
      value: typeof a?.value === "string" ? a.value.trim() : "",
    }))
    .filter((a) => a.name && a.value);
}

export async function POST(
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
  const attributes = parseAttributes(body?.attributes);
  const stock = Number.isFinite(body?.stock) ? Math.max(0, Math.trunc(body.stock)) : 0;

  if (attributes.length === 0) {
    return NextResponse.json(
      { error: "Kamida bitta xususiyat (nomi va qiymati) kiriting" },
      { status: 400 },
    );
  }

  const variant = await prisma.productVariant.create({
    data: { itemId: id, attributes: JSON.parse(JSON.stringify(attributes)), stock },
  });

  return NextResponse.json({ variant });
}
