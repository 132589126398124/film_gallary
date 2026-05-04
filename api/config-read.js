export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/gallery-config.json`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    return res.status(response.status).json({ error: 'Failed to fetch config' });
  }

  const data = await response.json();
  const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
  res.status(200).json(content);
}
