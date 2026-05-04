import busboy from 'busboy';

export const config = { api: { bodyParser: false } };

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const fields = {};
    let fileBuffer = null;
    let mimeType = null;

    bb.on('field', (name, value) => {
      fields[name] = value;
    });

    bb.on('file', (_name, stream, info) => {
      mimeType = info.mimeType;
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on('close', () => resolve({ fields, fileBuffer, mimeType }));
    bb.on('error', reject);

    req.pipe(bb);
  });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let parsed;
  try {
    parsed = await parseMultipart(req);
  } catch (e) {
    return res.status(400).json({ error: '파일 파싱 오류' });
  }

  const { fields, fileBuffer, mimeType } = parsed;

  if (!fields.password || fields.password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: '비밀번호 오류' });
  }

  const ext = MIME_TO_EXT[mimeType];
  if (!ext) {
    return res.status(400).json({ error: '지원하지 않는 파일 형식 (jpg, png, webp만 가능)' });
  }

  const filmId = fields.filmId;
  if (!filmId) {
    return res.status(400).json({ error: 'filmId가 없습니다' });
  }

  if (!fileBuffer || fileBuffer.length === 0) {
    return res.status(400).json({ error: '파일이 비어있습니다' });
  }

  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;
  const ghHeaders = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // List existing files to determine next number
  const listUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/images/${filmId}`;
  const listRes = await fetch(listUrl, { headers: ghHeaders });

  let nextNum = 1;
  if (listRes.ok) {
    const files = await listRes.json();
    if (Array.isArray(files)) {
      const nums = files
        .map((f) => parseInt(f.name.split('.')[0], 10))
        .filter((n) => !isNaN(n));
      if (nums.length > 0) nextNum = Math.max(...nums) + 1;
    }
  }

  const filename = `${String(nextNum).padStart(3, '0')}.${ext}`;
  const path = `images/${filmId}/${filename}`;
  const putUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

  const putRes = await fetch(putUrl, {
    method: 'PUT',
    headers: ghHeaders,
    body: JSON.stringify({
      message: `Upload ${path}`,
      content: fileBuffer.toString('base64'),
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    return res.status(500).json({ error: 'GitHub 업로드 실패', detail: err });
  }

  res.status(200).json({ filename, path });
}
