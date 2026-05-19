import { NextRequest, NextResponse } from 'next/server';
import { getGitHubHeaders, getGitHubApiBase } from '@/lib/github';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  const { password, config } = await request.json().catch(() => ({}));

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '비밀번호 오류' }, { status: 401 });
  }
  if (!config) {
    return NextResponse.json({ error: 'config가 없습니다' }, { status: 400 });
  }

  const apiUrl = `${getGitHubApiBase()}/gallery-config.json`;
  const headers = getGitHubHeaders();
  const content = Buffer.from(JSON.stringify(config, null, 2)).toString('base64');

  let sha: string | undefined;
  const getRes = await fetch(apiUrl, { headers });
  if (getRes.ok) {
    const getData = await getRes.json();
    sha = getData.sha;
  }

  async function tryPut(currentSha: string | undefined, attempt = 0): Promise<Response> {
    const body = {
      message: 'Update gallery-config.json via admin',
      content,
      ...(currentSha && { sha: currentSha }),
    };
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (putRes.status === 409 && attempt === 0) {
      const retryGet = await fetch(apiUrl, { headers });
      if (retryGet.ok) {
        const retryData = await retryGet.json();
        return tryPut(retryData.sha, 1);
      }
    }
    return putRes;
  }

  const putRes = await tryPut(sha);
  if (!putRes.ok) {
    const err = await putRes.json();
    return NextResponse.json({ error: 'GitHub API 오류', detail: err }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
