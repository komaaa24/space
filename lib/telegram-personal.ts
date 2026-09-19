import { TelegramClient } from "teleproto";
import { StringSession } from "teleproto/sessions";
import { NewMessage, type NewMessageEvent } from "teleproto/events";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { handleIncomingMessage } from "@/lib/inbound";
import { decryptCredential, encryptCredential } from "@/lib/credentials";

function getApiCredentials() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;
  if (!apiId || !apiHash) {
    throw new Error(
      "TELEGRAM_API_ID / TELEGRAM_API_HASH sozlanmagan (.env'ga qo'shing)",
    );
  }
  return { apiId, apiHash };
}

type LoginStatus = "pending" | "password_required" | "success" | "error";

interface PendingLogin {
  status: LoginStatus;
  qrDataUrl?: string;
  passwordHint?: string;
  error?: string;
  channelId?: string;
  controller: AbortController;
  resolvePassword?: (password: string) => void;
}

const pendingLogins = new Map<string, PendingLogin>();

// Ulangan (ONLINE) shaxsiy akkauntlar uchun jonli MTProto ulanishlar —
// server jarayoni davomida xotirada saqlanadi (instrumentation.ts orqali
// server ishga tushganda bootPersonalListeners() bilan tiklanadi).
const activeListeners = new Map<string, TelegramClient>();

export async function startQrLogin(clientId: string) {
  const { apiId, apiHash } = getApiCredentials();
  const loginId = crypto.randomUUID();
  const controller = new AbortController();

  const entry: PendingLogin = { status: "pending", controller };
  pendingLogins.set(loginId, entry);

  const session = new StringSession("");
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  let firstQrReady: (() => void) | undefined;
  const firstQr = new Promise<void>((resolve) => {
    firstQrReady = resolve;
  });

  (async () => {
    try {
      await client.connect();
      const user = await client.signInUserWithQrCode(
        { apiId, apiHash },
        {
          abortSignal: controller.signal,
          qrCode: async (code) => {
            const url = `tg://login?token=${code.token.toString("base64url")}`;
            entry.qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 320 });
            firstQrReady?.();
          },
          password: async (hint) => {
            entry.status = "password_required";
            entry.passwordHint = hint;
            return new Promise<string>((resolve) => {
              entry.resolvePassword = resolve;
            });
          },
          onError: async (err) => {
            entry.status = "error";
            entry.error = err.message;
            firstQrReady?.();
            return true;
          },
        },
      );

      if (entry.status === "error") return;

      const phone = "phone" in user ? (user as { phone?: string }).phone : undefined;
      const username = "username" in user ? (user as { username?: string }).username : undefined;
      const handle = username ? `@${username}` : phone ? `+${phone}` : "Shaxsiy akkaunt";

      const channel = await prisma.channel.create({
        data: {
          clientId,
          type: "TELEGRAM_PERSONAL",
          status: "ONLINE",
          handle,
          credential: encryptCredential(client.session.save() as unknown as string),
        },
      });

      entry.status = "success";
      entry.channelId = channel.id;

      activeListeners.set(channel.id, client);
      attachListener(client, channel.id, clientId);
    } catch (err) {
      entry.status = "error";
      entry.error = err instanceof Error ? err.message : "Noma'lum xatolik";
      firstQrReady?.();
      await client.destroy().catch(() => {});
    } finally {
      setTimeout(() => pendingLogins.delete(loginId), 5 * 60 * 1000);
    }
  })();

  await firstQr;
  return { loginId, status: entry.status, qrDataUrl: entry.qrDataUrl, error: entry.error };
}

export function getLoginStatus(loginId: string) {
  const entry = pendingLogins.get(loginId);
  if (!entry) return null;
  return {
    status: entry.status,
    qrDataUrl: entry.qrDataUrl,
    passwordHint: entry.passwordHint,
    error: entry.error,
    channelId: entry.channelId,
  };
}

export function submitLoginPassword(loginId: string, password: string) {
  const entry = pendingLogins.get(loginId);
  if (!entry?.resolvePassword) return false;
  entry.resolvePassword(password);
  entry.resolvePassword = undefined;
  return true;
}

export function cancelLogin(loginId: string) {
  const entry = pendingLogins.get(loginId);
  if (!entry) return false;
  entry.controller.abort();
  pendingLogins.delete(loginId);
  return true;
}

function attachListener(client: TelegramClient, channelId: string, clientId: string) {
  client.addEventHandler(async (event: NewMessageEvent) => {
    if (!event.isPrivate) return;
    const text = event.message.message;
    if (!text) return;

    const sender = await event.message.getSender().catch(() => null);
    const senderObj = sender as { firstName?: string; username?: string } | null;
    const fromName = senderObj?.firstName ?? "Mijoz";
    const fromUsername = senderObj?.username;

    try {
      await handleIncomingMessage({
        channelId,
        clientId,
        contactId: String(event.message.senderId),
        text,
        fromName,
        fromUsername,
        sendReply: async (reply) => {
          await event.respond({ message: reply });
        },
      });
    } catch (err) {
      console.error(`[shaxsiy:${channelId}] xabarni qayta ishlashda xatolik:`, err);
    }
  }, new NewMessage({ incoming: true }));
}

// Kanal uzilganda (foydalanuvchi "Uzish" tugmasini bosganda) Telegram
// tomonida ham sessiyani bekor qiladi. Agar jarayon qayta ishga tushgan
// bo'lsa-yu, ulanish xotirada bo'lmasa — saqlangan sessiya orqali vaqtinchalik
// ulanib, shu orqali chiqib ketadi.
export async function disconnectPersonalChannel(channelId: string, savedSession?: string) {
  let client = activeListeners.get(channelId);

  if (!client && savedSession) {
    try {
      const { apiId, apiHash } = getApiCredentials();
      const session = new StringSession(decryptCredential(savedSession) ?? savedSession);
      client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 2 });
      await client.connect();
    } catch {
      client = undefined;
    }
  }

  if (client) {
    await client.logOut().catch(() => {});
  }

  activeListeners.delete(channelId);
}

// Server ishga tushganda (instrumentation.ts) barcha ONLINE shaxsiy
// akkauntlar uchun saqlangan sessiyani qayta ulaydi.
export async function bootPersonalListeners() {
  let apiId: number, apiHash: string;
  try {
    ({ apiId, apiHash } = getApiCredentials());
  } catch {
    return;
  }

  const channels = await prisma.channel.findMany({
    where: { type: "TELEGRAM_PERSONAL", status: "ONLINE" },
  });

  for (const channel of channels) {
    if (!channel.credential || activeListeners.has(channel.id)) continue;
    try {
      const session = new StringSession(decryptCredential(channel.credential) ?? channel.credential);
      const client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 5,
      });
      await client.connect();
      activeListeners.set(channel.id, client);
      attachListener(client, channel.id, channel.clientId);
      console.log(`[shaxsiy:${channel.id}] qayta ulandi (${channel.handle})`);
    } catch (err) {
      console.error(`[shaxsiy:${channel.id}] qayta ulanishda xatolik:`, err);
    }
  }
}
