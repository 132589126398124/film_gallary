import { NextRequest, NextResponse } from 'next/server';
import { getGitHubHeaders, getGitHubApiBase } from '@/lib/github';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  const { password, filmId, filename } = await request.json().catch(() => ({}));

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'パスワードエラー' }, { status: 401 });
  }
  if (!filmId || !filename) {
    return NextResponse.json({ error: 'filmId / filename が必要です' }, { status: 400 });
  }

  const path = `public/images/${filmId}/${filename}`;
  const apiUrl = `${getGitHubApiBase()}/${path}`;
  const headers = getGitHubHeaders();

  const getRes = await fetch(apiUrl, { headers });
  if (getRes.status === 404) return NextResponse.json({ ok: true });
  if (!getRes.ok) return NextResponse.json({ error: 'SHA取得失敗' }, { status: 500 });

  const { sha } = await getRes.json();

  const delRes = await fetch(apiUrl, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ message: `Delete ${path}`, sha }),
  });

  if (!delRes.ok) {
    const err = await delRes.json();
    return NextResponse.json({ error: 'GitHub削除失敗', detail: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
