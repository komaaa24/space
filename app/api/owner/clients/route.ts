import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireOwner() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return null;
  return session;
}

export async function GET() {
  const session = await requireOwner();
  if (!session) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: { select: { id: true, email: true, role: true, createdAt: true } },
      channels: { select: { id: true, type: true, status: true, handle: true } },
      _count: {
        select: {
          conversations: true,
          requests: true,
          knowledgeItems: true,
          faqs: true,
          catalogItems: true,
          payments: true,
          automations: true,
        },
      },
    },
  });

  const clientIds = clients.map((client) => client.id);

  const [
    conversationsThisMonth,
    messages,
    requestsByCategory,
    payments,
    automationRuns,
  ] = await Promise.all([
    prisma.conversation.groupBy({
      by: ["clientId"],
      where: { clientId: { in: clientIds }, createdAt: { gte: startOfMonth } },
      _count: true,
    }),
    prisma.message.findMany({
      where: { conversation: { clientId: { in: clientIds } } },
      select: {
        role: true,
        createdAt: true,
        conversation: { select: { clientId: true } },
      },
    }),
    prisma.request.groupBy({
      by: ["clientId", "category"],
      where: { clientId: { in: clientIds } },
      _count: true,
    }),
    prisma.payment.findMany({
      where: { clientId: { in: clientIds } },
      select: { clientId: true, status: true, amount: true },
    }),
    prisma.automationRun.findMany({
      where: { automation: { clientId: { in: clientIds } } },
      select: {
        status: true,
        linkClicked: true,
        automation: { select: { clientId: true } },
      },
    }),
  ]);

  const monthDialogsByClient = new Map(
    conversationsThisMonth.map((item) => [item.clientId, item._count]),
  );
  const messagesByClient = new Map<
    string,
    { total: number; incoming: number; outgoing: number; lastMessageAt: Date | null }
  >();
  for (const message of messages) {
    const clientId = message.conversation.clientId;
    const current =
      messagesByClient.get(clientId) ??
      { total: 0, incoming: 0, outgoing: 0, lastMessageAt: null };
    current.total += 1;
    if (message.role === "USER") current.incoming += 1;
    else current.outgoing += 1;
    if (!current.lastMessageAt || message.createdAt > current.lastMessageAt) {
      current.lastMessageAt = message.createdAt;
    }
    messagesByClient.set(clientId, current);
  }

  const requestsByClient = new Map<
    string,
    { leads: number; interested: number; complaints: number; suggestions: number }
  >();
  for (const request of requestsByCategory) {
    const current =
      requestsByClient.get(request.clientId) ??
      { leads: 0, interested: 0, complaints: 0, suggestions: 0 };
    if (request.category === "LEAD") current.leads = request._count;
    if (request.category === "INTERESTED") current.interested = request._count;
    if (request.category === "COMPLAINT") current.complaints = request._count;
    if (request.category === "SUGGESTION") current.suggestions = request._count;
    requestsByClient.set(request.clientId, current);
  }

  const paymentsByClient = new Map<
    string,
    { total: number; paid: number; paidAmount: number; pending: number }
  >();
  for (const payment of payments) {
    const current =
      paymentsByClient.get(payment.clientId) ??
      { total: 0, paid: 0, paidAmount: 0, pending: 0 };
    current.total += 1;
    if (payment.status === "PAID") {
      current.paid += 1;
      current.paidAmount += payment.amount;
    }
    if (payment.status === "PENDING") current.pending += 1;
    paymentsByClient.set(payment.clientId, current);
  }

  const automationRunsByClient = new Map<
    string,
    { total: number; delivered: number; linkClicked: number }
  >();
  for (const run of automationRuns) {
    const clientId = run.automation.clientId;
    const current =
      automationRunsByClient.get(clientId) ??
      { total: 0, delivered: 0, linkClicked: 0 };
    current.total += 1;
    if (run.status === "DELIVERED") current.delivered += 1;
    if (run.linkClicked) current.linkClicked += 1;
    automationRunsByClient.set(clientId, current);
  }

  const enrichedClients = clients.map((client) => ({
    ...client,
    stats: {
      conversations: client._count.conversations,
      conversationsThisMonth: monthDialogsByClient.get(client.id) ?? 0,
      messages: messagesByClient.get(client.id)?.total ?? 0,
      incomingMessages: messagesByClient.get(client.id)?.incoming ?? 0,
      outgoingMessages: messagesByClient.get(client.id)?.outgoing ?? 0,
      lastMessageAt: messagesByClient.get(client.id)?.lastMessageAt ?? null,
      requests: client._count.requests,
      requestCategories:
        requestsByClient.get(client.id) ??
        { leads: 0, interested: 0, complaints: 0, suggestions: 0 },
      channels: client.channels.length,
      onlineChannels: client.channels.filter((channel) => channel.status === "ONLINE").length,
      knowledgeItems: client._count.knowledgeItems,
      faqs: client._count.faqs,
      catalogItems: client._count.catalogItems,
      automations: client._count.automations,
      automationRuns:
        automationRunsByClient.get(client.id) ??
        { total: 0, delivered: 0, linkClicked: 0 },
      payments:
        paymentsByClient.get(client.id) ??
        { total: 0, paid: 0, paidAmount: 0, pending: 0 },
    },
  }));

  return NextResponse.json({ clients: enrichedClients });
}

export async function POST(req: Request) {
  const session = await requireOwner();
  if (!session) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const company = typeof body?.company === "string" ? body.company.trim() : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const plan = ["FREE", "PRO", "VIP"].includes(body?.plan)
    ? body.plan
    : "FREE";

  if (!company || !email || !password) {
    return NextResponse.json(
      { error: "Barcha maydonlarni to'ldiring" },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Parol kamida 6 belgidan iborat bo'lishi kerak" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Bu email allaqachon band" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const client = await prisma.client.create({
    data: {
      company,
      plan,
      status: "TRIAL",
      users: {
        create: { email, passwordHash, role: "CLIENT_ADMIN" },
      },
    },
    include: { users: true },
  });

  return NextResponse.json({ client });
}
