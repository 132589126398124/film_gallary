import { NextResponse } from 'next/server';
import { getGitHubHeaders, getGitHubApiBase } from '@/lib/github';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function GET() {
  const url = `${getGitHubApiBase()}/gallery-config.json`;
  const response = await fetch(url, { headers: getGitHubHeaders() });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: response.status });
  }

  const data = await response.json();
  const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
  return NextResponse.json(content);
}
