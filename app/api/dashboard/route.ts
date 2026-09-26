import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { parseDashboardRange } from '@/lib/dashboard-range';
import { getDashboard } from '@/lib/dashboard';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.clientId)
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
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
    return NextResponse.json(await getDashboard(session.clientId, range), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    console.error('[dashboard] Statistikani yuklash amalga oshmadi');
    return NextResponse.json(
      { error: "Statistikani yuklab bo'lmadi. Qayta urinib ko'ring." },
      { status: 500 },
    );
  }
}
