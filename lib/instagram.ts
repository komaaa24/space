import { getAppBaseUrl } from "@/lib/env";
import { decryptCredential } from "@/lib/credentials";

const GRAPH_VERSION = "v21.0";

export { getAppBaseUrl };

function getAppCredentials() {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET .env'ga qo'shilmagan");
  }
  return { appId, appSecret };
}

function getRedirectUri() {
  return `${getAppBaseUrl()}/api/channels/instagram/callback`;
}

// Instagram API with Instagram Login — Facebook Page shart emas, to'g'ridan-to'g'ri
// Instagram akkaunti orqali kiradi (Reveo va boshqa zamonaviy platformalar shu
// oqimni ishlatadi).
const OAUTH_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
].join(",");

export function getInstagramOAuthUrl(state: string) {
  const { appId } = getAppCredentials();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: OAUTH_SCOPES,
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

interface ShortLivedTokenResponse {
  access_token: string;
  user_id: string;
  permissions?: string[];
  error_type?: string;
  error_message?: string;
}

export async function exchangeCodeForToken(code: string) {
  const { appId, appSecret } = getAppCredentials();
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: getRedirectUri(),
    code,
  });
  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data: ShortLivedTokenResponse = await res.json();
  if (!res.ok || data.error_message) {
    throw new Error(data.error_message ?? "Kod almashtirishda xatolik");
  }
  return { accessToken: data.access_token, igUserId: data.user_id };
}

interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  error?: { message: string };
}

export async function getLongLivedToken(shortLivedToken: string) {
  const { appSecret } = getAppCredentials();
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: appSecret,
    access_token: shortLivedToken,
  });
  const res = await fetch(`https://graph.instagram.com/access_token?${params.toString()}`);
  const data: LongLivedTokenResponse = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? "Uzoq muddatli tokenga almashtirishda xatolik");
  }
  return data.access_token;
}

export async function getInstagramAccountInfo(accessToken: string) {
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me?fields=user_id,username&access_token=${accessToken}`,
  );
  const data: { user_id?: string; username?: string; error?: { message: string } } =
    await res.json();
  if (!res.ok || data.error || !data.username) {
    throw new Error(data.error?.message ?? "Akkaunt ma'lumotini olishda xatolik");
  }
  return { igUserId: data.user_id!, username: data.username };
}

export async function subscribeToMessaging(accessToken: string) {
  const params = new URLSearchParams({
    subscribed_fields: "messages,comments",
    access_token: accessToken,
  });
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me/subscribed_apps?${params.toString()}`,
    { method: "POST" },
  );
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? "Webhook obunasida xatolik");
  }
}

export async function unsubscribeFromMessaging(accessToken: string) {
  await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me/subscribed_apps?access_token=${accessToken}`,
    { method: "DELETE" },
  ).catch(() => {});
}

export async function sendInstagramMessage(
  accessToken: string,
  recipientId: string,
  text: string,
) {
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me/messages?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    },
  );
  const data = await res.json();
  if (!res.ok || data.error) {
    console.error("Instagram xabar yuborishda xatolik:", data.error);
    throw new Error(data.error?.message ?? "Instagram xabar yuborishda xatolik");
  }
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  thumbnailUrl?: string;
  mediaType?: string;
  permalink?: string;
}

// Post-tanlash UI'si uchun — akkauntning so'nggi postlari
export async function getRecentMedia(accessToken: string): Promise<InstagramMedia[]> {
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me/media?fields=id,caption,thumbnail_url,media_url,media_type,permalink&limit=30&access_token=${accessToken}`,
  );
  const data: {
    data?: {
      id: string;
      caption?: string;
      thumbnail_url?: string;
      media_url?: string;
      media_type?: string;
      permalink?: string;
    }[];
    error?: { message: string };
  } = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? "Postlar ro'yxatini olishda xatolik");
  }
  return (data.data ?? []).map((m) => ({
    id: m.id,
    caption: m.caption,
    thumbnailUrl: m.thumbnail_url ?? m.media_url,
    mediaType: m.media_type,
    permalink: m.permalink,
  }));
}

// Kommentga OCHIQ (hammaga ko'rinadigan) javob — avtomatik "public reply"
export async function replyToComment(accessToken: string, commentId: string, text: string) {
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/${commentId}/replies?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    },
  );
  const data = await res.json();
  if (!res.ok || data.error) {
    console.error("Kommentga javob yozishda xatolik:", data.error);
    throw new Error(data.error?.message ?? "Kommentga javob yozishda xatolik");
  }
}

// Kommentga yozgan foydalanuvchiga DM orqali maxfiy (private) javob —
// Send API'ning recipient maydoni odatdagi PSID o'rniga comment_id qabul qiladi.
// Javobda recipient_id qaytadi — shu foydalanuvchining doimiy PSID'i,
// keyingi xabarlarni oddiy sendInstagramMessage/sendInstagramQuickReply
// orqali (recipient.id) yuborish uchun ishlatiladi.
export async function sendPrivateReplyToComment(
  accessToken: string,
  commentId: string,
  text: string,
  quickReply?: { buttonLabel: string; payload: string },
) {
  const message: Record<string, unknown> = { text };
  if (quickReply) {
    message.quick_replies = [
      { content_type: "text", title: quickReply.buttonLabel, payload: quickReply.payload },
    ];
  }
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me/messages?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { comment_id: commentId },
        message,
      }),
    },
  );
  const data = await res.json();
  if (!res.ok || data.error) {
    console.error("Kommentga maxfiy javob yuborishda xatolik:", data.error);
    throw new Error(data.error?.message ?? "Kommentga maxfiy javob yuborishda xatolik");
  }
  return data as { recipient_id?: string; error?: unknown };
}

// Tugmali xabar — Instagram "quick reply" orqali. Foydalanuvchi tugmani
// bossa, keyingi webhook message eventida message.text = tugma matni,
// message.quick_reply.payload = shu yerda berilgan payload bo'lib keladi.
export async function sendInstagramQuickReply(
  accessToken: string,
  recipientId: string,
  text: string,
  buttonLabel: string,
  payload: string,
) {
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me/messages?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          text,
          quick_replies: [{ content_type: "text", title: buttonLabel, payload }],
        },
      }),
    },
  );
  const data = await res.json();
  if (!res.ok || data.error) {
    console.error("Instagram quick-reply yuborishda xatolik:", data.error);
    throw new Error(data.error?.message ?? "Instagram quick-reply yuborishda xatolik");
  }
}

export async function getInstagramUserProfile(accessToken: string, igsid: string) {
  try {
    const res = await fetch(
      `https://graph.instagram.com/${GRAPH_VERSION}/${igsid}?fields=name,username&access_token=${accessToken}`,
    );
    const data: { name?: string; username?: string } = await res.json();
    return { name: data.name, username: data.username };
  } catch {
    return { name: undefined, username: undefined };
  }
}

// DIQQAT: Meta hozircha standart Instagram Graph API orqali "bu foydalanuvchi
// meni kuzatadimi" degan ishonchli, hujjatlashtirilgan endpointni ochiq
// taqdim etmaydi. `is_user_follow_business` maydoni ba'zi holatlarda
// ishlaydi, lekin bu real trafik bilan tasdiqlanishi kerak (loyihaning
// odatdagi ishlash tartibi — avval eng yaxshi bilim bilan yozib, keyin
// sinash). Agar API doim false/xato qaytarsa, checkSubscription vaqtincha
// "har doim ha" deb ishlaydigan qilib almashtirilishi kerak bo'ladi.
export async function checkIsFollowing(accessToken: string, igsid: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.instagram.com/${GRAPH_VERSION}/${igsid}?fields=is_user_follow_business&access_token=${accessToken}`,
    );
    const data: { is_user_follow_business?: boolean; error?: unknown } = await res.json();
    if (!res.ok || data.error) return false;
    return Boolean(data.is_user_follow_business);
  } catch {
    return false;
  }
}

export interface InstagramCredential {
  igAccountId: string;
  accessToken: string;
}

export function parseInstagramCredential(raw: string): InstagramCredential {
  return JSON.parse(decryptCredential(raw) ?? raw);
}
