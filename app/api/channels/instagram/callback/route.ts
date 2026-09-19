import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getInstagramAccountInfo,
  subscribeToMessaging,
  getAppBaseUrl,
} from "@/lib/instagram";
import { encryptCredential } from "@/lib/credentials";

function redirectToChannels(error?: string) {
  const url = new URL("/admin/channels", getAppBaseUrl());
  if (error) url.searchParams.set("ig_error", error);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.redirect(new URL("/login", getAppBaseUrl()));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get("ig_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToChannels("Sessiya muddati tugagan, qayta urinib ko'ring");
  }

  try {
    const { accessToken: shortLivedToken } = await exchangeCodeForToken(code);
    const accessToken = await getLongLivedToken(shortLivedToken);
    const { igUserId, username } = await getInstagramAccountInfo(accessToken);

    await subscribeToMessaging(accessToken);

    const credential = encryptCredential(JSON.stringify({ igAccountId: igUserId, accessToken }));
    const existing = await prisma.channel.findFirst({
      where: { clientId: session.clientId, type: "INSTAGRAM" },
    });

    if (existing) {
      await prisma.channel.update({
        where: { id: existing.id },
        data: { status: "ONLINE", handle: `@${username}`, credential, externalAccountId: igUserId },
      });
    } else {
      await prisma.channel.create({
        data: {
          clientId: session.clientId,
          type: "INSTAGRAM",
          status: "ONLINE",
          handle: `@${username}`,
          credential,
          externalAccountId: igUserId,
        },
      });
    }

    const res = redirectToChannels();
    res.cookies.delete("ig_oauth_state");
    return res;
  } catch (err) {
    console.error("Instagram OAuth xatosi:", err);
    return redirectToChannels(err instanceof Error ? err.message : "Noma'lum xatolik");
  }
}
