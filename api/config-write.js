export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, config } = req.body;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: '비밀번호 오류' });
  }

  if (!config) {
    return res.status(400).json({ error: 'config가 없습니다' });
  }

  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/gallery-config.json`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // Get current file SHA
  let sha;
  const getRes = await fetch(apiUrl, { headers });
  if (getRes.ok) {
    const getData = await getRes.json();
    sha = getData.sha;
  }

  const body = {
    message: 'Update gallery-config.json via admin',
    content: Buffer.from(JSON.stringify(config, null, 2)).toString('base64'),
    ...(sha && { sha }),
  };

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    return res.status(500).json({ error: 'GitHub API 오류', detail: err });
  }

  res.status(200).json({ success: true });
}
