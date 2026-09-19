import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "chatspace_session";
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_EXEMPT_PREFIXES = [
  "/api/webhooks/",
  "/api/auth/google/",
  "/api/automations/click/",
];
const CSRF_EXEMPT_PATHS = new Set(["/api/health"]);

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET .env faylida topilmadi");
  return new TextEncoder().encode(secret);
}

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    if (!isSameOriginMutation(req)) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const loginUrl = new URL("/login", req.url);

  if (!token) return NextResponse.redirect(loginUrl);

  let payload: { role?: string } | null = null;
  try {
    const result = await jwtVerify(token, getSecret());
    payload = result.payload as { role?: string };
  } catch {
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  const isOwnerArea = req.nextUrl.pathname.startsWith("/owner");
  if (isOwnerArea && payload.role !== "OWNER") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

function isSameOriginMutation(req: NextRequest) {
  if (!MUTATING_METHODS.has(req.method)) return true;

  const pathname = req.nextUrl.pathname;
  if (CSRF_EXEMPT_PATHS.has(pathname)) return true;
  if (CSRF_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;

  const allowedOrigin =
    process.env.APP_BASE_URL || process.env.RENDER_EXTERNAL_URL || req.nextUrl.origin;
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  let requestOrigin = origin;
  if (!requestOrigin && referer) {
    try {
      requestOrigin = new URL(referer).origin;
    } catch {
      requestOrigin = null;
    }
  }

  return requestOrigin === new URL(allowedOrigin).origin;
}

export const config = {
  matcher: ["/admin/:path*", "/owner/:path*", "/api/:path*"],
};
