import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAnalytics } from '@/lib/analytics-query';
import { parseDashboardRange } from '@/lib/dashboard-range';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  let range;
  try {
    range = parseDashboardRange(new URL(request.url).searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Davr noto'g'ri" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await getAnalytics(session.clientId, range), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('[analytics] Statistikani yuklash amalga oshmadi', error);
    return NextResponse.json(
      { error: "Analitikani yuklab bo'lmadi. Qayta urinib ko'ring." },
      { status: 500 },
    );
  }
}
