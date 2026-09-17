import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/env";

// Avtomatizatsiya yakuniy havolasi shu orqali o'tadi — bosilganini
// qayd etib, keyin haqiqiy havolaga yo'naltiradi (analitika + followUp uchun).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const run = await prisma.automationRun.findUnique({
    where: { id },
    include: { automation: true },
  });

  if (!run) {
    return NextResponse.redirect(getAppBaseUrl());
  }

  if (!run.linkClicked) {
    const now = new Date();
    const followUpDueAt =
      run.automation.followUpEnabled && run.automation.followUpMinutes
        ? new Date(now.getTime() + run.automation.followUpMinutes * 60_000)
        : null;
    await prisma.automationRun.update({
      where: { id },
      data: { linkClicked: true, followUpDueAt },
    });
  }

  return NextResponse.redirect(run.automation.deliveredLinkUrl ?? getAppBaseUrl());
}
