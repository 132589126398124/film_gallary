import { NextRequest, NextResponse } from 'next/server';
import { getGitHubHeaders, getGitHubApiBase } from '@/lib/github';

export const maxDuration = 60;

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const password = formData.get('password') as string;
    const filmId = formData.get('filmId') as string;
    const file = formData.get('file') as File | null;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '비밀번호 오류' }, { status: 401 });
    }
    if (!filmId || !file) {
      return NextResponse.json({ error: 'filmId と file が必要です' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'ファイルが空です' }, { status: 400 });
    }

    const ext = MIME_TO_EXT[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식 (jpg, png, webp만 가능)' },
        { status: 400 },
      );
    }

    const headers = getGitHubHeaders();
    const listUrl = `${getGitHubApiBase()}/public/images/${filmId}`;
    const listRes = await fetch(listUrl, { headers });

    let nextNum = 1;
    if (listRes.ok) {
      const files = await listRes.json();
      if (Array.isArray(files)) {
        const nums = files
          .map((f: { name: string }) => parseInt(f.name.split('.')[0], 10))
          .filter((n) => !isNaN(n));
        if (nums.length > 0) nextNum = Math.max(...nums) + 1;
      }
    }

    const filename = `${String(nextNum).padStart(3, '0')}.${ext}`;
    const path = `public/images/${filmId}/${filename}`;
    const putUrl = `${getGitHubApiBase()}/${path}`;

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `Upload ${path}`,
        content: base64,
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      return NextResponse.json({ error: 'GitHub 업로드 실패', detail: err }, { status: 500 });
    }

    return NextResponse.json({ filename, path });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
