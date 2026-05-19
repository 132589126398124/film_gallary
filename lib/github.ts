export function getGitHubHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

export function getGitHubApiBase(): string {
  const { GITHUB_OWNER, GITHUB_REPO } = process.env;
  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents`;
}

export async function getFileSha(path: string): Promise<string | null> {
  const url = `${getGitHubApiBase()}/${path}`;
  const res = await fetch(url, { headers: getGitHubHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  return data.sha ?? null;
}

export async function putFile(
  path: string,
  content: string,
  message: string,
  sha?: string,
): Promise<Response> {
  const url = `${getGitHubApiBase()}/${path}`;
  return fetch(url, {
    method: 'PUT',
    headers: getGitHubHeaders(),
    body: JSON.stringify({ message, content, ...(sha && { sha }) }),
  });
}

export async function deleteFile(
  path: string,
  sha: string,
  message: string,
): Promise<Response> {
  const url = `${getGitHubApiBase()}/${path}`;
  return fetch(url, {
    method: 'DELETE',
    headers: getGitHubHeaders(),
    body: JSON.stringify({ message, sha }),
  });
}
