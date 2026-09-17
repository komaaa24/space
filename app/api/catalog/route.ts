import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, forbiddenByPlan } from "@/lib/access-control";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }
  const items = await prisma.catalogItem.findMany({
    where: { clientId: session.clientId },
    orderBy: { createdAt: "desc" },
    include: { variants: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
  if (!(await canUseFeature(session.clientId, "catalog"))) {
    return forbiddenByPlan("Katalog faqat VIP tarifda ochiq");
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const price = typeof body?.price === "string" ? body.price.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const emoji = typeof body?.emoji === "string" && body.emoji.trim() ? body.emoji.trim() : "📦";
  const inStock = typeof body?.inStock === "boolean" ? body.inStock : true;

  if (!name || !price || !category) {
    return NextResponse.json(
      { error: "Nomi, narxi va kategoriyasi to'ldirilishi kerak" },
      { status: 400 },
    );
  }

  const rawVariants = Array.isArray(body?.variants) ? body.variants : [];
  const variants = rawVariants
    .map((v: { attributes?: unknown; stock?: unknown }) => {
      const attributes = Array.isArray(v?.attributes)
        ? v.attributes
            .map((a: { name?: unknown; value?: unknown }) => ({
              name: typeof a?.name === "string" ? a.name.trim() : "",
              value: typeof a?.value === "string" ? a.value.trim() : "",
            }))
            .filter((a: { name: string; value: string }) => a.name && a.value)
        : [];
      const stock = Number.isFinite(v?.stock) ? Math.max(0, Math.trunc(v.stock as number)) : 0;
      return { attributes, stock };
    })
    .filter((v: { attributes: unknown[] }) => v.attributes.length > 0);

  const item = await prisma.catalogItem.create({
    data: {
      clientId: session.clientId,
      name,
      price,
      category,
      emoji,
      inStock,
      variants: variants.length
        ? {
            create: variants.map((v: { attributes: unknown; stock: number }) => ({
              attributes: JSON.parse(JSON.stringify(v.attributes)),
              stock: v.stock,
            })),
          }
        : undefined,
    },
    include: { variants: true },
  });

  return NextResponse.json({ item });
}
