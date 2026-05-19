import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({}));
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'パスワードが正しくありません' }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
