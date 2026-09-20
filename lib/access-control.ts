import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PlanTier } from "@/lib/generated/prisma";

export type FeatureKey = "instagramAutomation" | "aiAgent" | "catalog" | "autoReply";

export const PLAN_RULES: Record<
  PlanTier,
  {
    label: string;
    monthlyPrice: number;
    yearlyMonthlyPrice: number;
    automationMonthlyLimit: number | null;
    features: Record<FeatureKey, boolean>;
  }
> = {
  FREE: {
    label: "FREE",
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    automationMonthlyLimit: 200,
    features: {
      instagramAutomation: true,
      aiAgent: false,
      catalog: false,
      autoReply: true,
    },
  },
  PRO: {
    label: "PRO",
    monthlyPrice: 75_000,
    yearlyMonthlyPrice: 50_000,
    automationMonthlyLimit: null,
    features: {
      instagramAutomation: true,
      aiAgent: false,
      catalog: false,
      autoReply: true,
    },
  },
  VIP: {
    label: "VIP",
    monthlyPrice: 300_000,
    yearlyMonthlyPrice: 225_000,
    automationMonthlyLimit: null,
    features: {
      instagramAutomation: true,
      aiAgent: true,
      catalog: true,
      autoReply: true,
    },
  },
};

export function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getActivePlan(clientId: string): Promise<PlanTier> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      plan: true,
      messageMonthlyLimit: true,
      messagePackagePrice: true,
      messagePackageCurrency: true,
      messagePackageNote: true,
      subscriptions: {
        where: { status: "ACTIVE", endsAt: { gt: new Date() } },
        orderBy: { endsAt: "desc" },
        take: 1,
        select: { plan: true },
      },
    },
  });

  if (!client) return "FREE";
  return client.subscriptions[0]?.plan ?? client.plan;
}

export async function getClientAccess(clientId: string) {
  const plan = await getActivePlan(clientId);
  const rules = PLAN_RULES[plan];
  const monthStart = getMonthStart();
  const [client, automationUsedThisMonth, aiMessagesUsedThisMonth] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      select: {
        messageMonthlyLimit: true,
        messagePackagePrice: true,
        messagePackageCurrency: true,
        messagePackageNote: true,
      },
    }),
    prisma.automationRun.count({
      where: {
        createdAt: { gte: monthStart },
        automation: { clientId },
      },
    }),
    prisma.message.count({
      where: {
        role: "AI",
        createdAt: { gte: monthStart },
        conversation: { clientId },
      },
    }),
  ]);
  const automationRemaining =
    rules.automationMonthlyLimit === null
      ? null
      : Math.max(0, rules.automationMonthlyLimit - automationUsedThisMonth);
  const messageMonthlyLimit = client?.messageMonthlyLimit ?? null;
  const messageRemaining =
    messageMonthlyLimit === null
      ? null
      : Math.max(0, messageMonthlyLimit - aiMessagesUsedThisMonth);

  return {
    plan,
    rules,
    features: rules.features,
    usage: {
      automationUsedThisMonth,
      automationMonthlyLimit: rules.automationMonthlyLimit,
      automationRemaining,
      aiMessagesUsedThisMonth,
      messageMonthlyLimit,
      messageRemaining,
      messagePackagePrice: client?.messagePackagePrice ?? 0,
      messagePackageCurrency: client?.messagePackageCurrency ?? "USD",
      messagePackageNote: client?.messagePackageNote ?? "",
    },
  };
}

export async function canUseFeature(clientId: string, feature: FeatureKey) {
  const access = await getClientAccess(clientId);
  return access.features[feature];
}

export async function canStartAutomation(clientId: string) {
  const access = await getClientAccess(clientId);
  if (!access.features.instagramAutomation) {
    return { allowed: false, reason: "Tarifingizda Instagram Automation yopiq", access };
  }
  if (
    access.usage.automationMonthlyLimit !== null &&
    access.usage.automationUsedThisMonth >= access.usage.automationMonthlyLimit
  ) {
    return {
      allowed: false,
      reason: "FREE tarif uchun oylik 200 ta automation dialog limiti tugagan",
      access,
    };
  }
  return { allowed: true, reason: null, access };
}

export async function canSendAiMessage(clientId: string) {
  const access = await getClientAccess(clientId);
  if (
    access.usage.messageMonthlyLimit !== null &&
    access.usage.aiMessagesUsedThisMonth >= access.usage.messageMonthlyLimit
  ) {
    return {
      allowed: false,
      reason: "AI xabar paketi limiti tugagan",
      access,
    };
  }
  return { allowed: true, reason: null, access };
}

export function forbiddenByPlan(message = "Bu funksiya joriy tarifingizda yopiq") {
  return NextResponse.json({ error: message, code: "PLAN_LOCKED" }, { status: 403 });
}
