export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, filmId, filename } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'パスワードエラー' });
  }
  if (!filmId || !filename) {
    return res.status(400).json({ error: 'filmId / filename が必要です' });
  }

  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;
  const path = `images/${filmId}/${filename}`;
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // SHA 취득
  const getRes = await fetch(apiUrl, { headers });
  if (getRes.status === 404) return res.status(200).json({ ok: true }); // 이미 없음
  if (!getRes.ok) return res.status(500).json({ error: 'SHA取得失敗' });

  const { sha } = await getRes.json();

  const delRes = await fetch(apiUrl, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ message: `Delete ${path}`, sha }),
  });

  if (!delRes.ok) {
    const err = await delRes.json();
    return res.status(500).json({ error: 'GitHub削除失敗', detail: err });
  }

  res.status(200).json({ ok: true });
}
