'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Film, GalleryConfig } from '@/lib/types';

const PRICE_OPTIONS = [0, 5000, 10000] as const;

function getPassword(): string {
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem('adminPassword') || '';
}

/* ── Toast ── */
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);

  const showToast = useCallback((message: string, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  function ToastContainer() {
    return (
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    );
  }

  return { showToast, ToastContainer };
}

/* ── Login ── */
function LoginScreen({ onLogin }: { onLogin: (pw: string) => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pw.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'パスワードが正しくありません');
        return;
      }
      sessionStorage.setItem('adminPassword', pw);
      onLogin(pw);
    } catch {
      setError('サーバーに接続できませんでした');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>管理者ログイン</h1>
        <input
          type="password"
          placeholder="パスワード"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
        />
        {error && <div className="login-error">{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
    </div>
  );
}

/* ── Thumbnail Grid ── */
function ThumbnailGrid({
  film,
  onDelete,
  onReorder,
}: {
  film: Film;
  onDelete: (filmId: string, filename: string) => void;
  onReorder: (filmId: string, newPhotos: string[]) => void;
}) {
  const dragIdx = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  if (film.photos.length === 0) {
    return <div className="thumb-empty">まだ写真がありません</div>;
  }

  function movePhoto(from: number, to: number) {
    if (to < 0 || to >= film.photos.length) return;
    const next = [...film.photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(film.id, next);
  }

  return (
    <div className="thumb-grid">
      {film.photos.map((filename, i) => (
        <div
          className={`thumb-item${overIdx === i ? ' drag-over' : ''}`}
          key={filename}
          draggable
          onDragStart={() => { dragIdx.current = i; }}
          onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }}
          onDrop={() => {
            const from = dragIdx.current;
            if (from === null || from === i) { setOverIdx(null); return; }
            movePhoto(from, i);
            dragIdx.current = null;
            setOverIdx(null);
          }}
          onDragEnd={() => { dragIdx.current = null; setOverIdx(null); }}
          onDragLeave={() => setOverIdx(null)}
        >
          <img src={`/images/${film.id}/${filename}`} alt={`${film.name_jp} ${i + 1}`} />
          <button className="thumb-delete" onClick={() => onDelete(film.id, filename)} title="削除">
            ×
          </button>
          <div className="thumb-drag-handle">⠿</div>
          <div className="thumb-move-btns">
            <button
              className="thumb-move"
              disabled={i === 0}
              onClick={() => movePhoto(i, i - 1)}
              title="前へ"
            >
              ‹
            </button>
            <button
              className="thumb-move"
              disabled={i === film.photos.length - 1}
              onClick={() => movePhoto(i, i + 1)}
              title="次へ"
            >
              ›
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Upload Zone ── */
const MAX_UPLOAD_BYTES = 4.3 * 1024 * 1024;

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_DIM = 4000;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const scale = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      const qualities = [0.95, 0.88, 0.80, 0.70, 0.60, 0.50, 0.40];
      let idx = 0;
      function tryNext() {
        if (idx >= qualities.length) {
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.40);
          return;
        }
        const q = qualities[idx++];
        canvas.toBlob((blob) => {
          if (blob && blob.size <= MAX_UPLOAD_BYTES) resolve(blob);
          else tryNext();
        }, 'image/jpeg', q);
      }
      tryNext();
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

function UploadZone({
  filmId,
  onUpload,
  disabled,
}: {
  filmId: string;
  onUpload: (filenames: string[]) => Promise<void>;
  disabled: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadSingle(file: File, current: number, total: number): Promise<string> {
    const prefix = total > 1 ? `${current}/${total} ` : '';
    let fileToUpload: File | Blob = file;

    if (file.size > MAX_UPLOAD_BYTES) {
      setStatusText(`${prefix}圧縮中...`);
      const compressed = await compressImage(file);
      fileToUpload = new File([compressed], file.name.replace(/\.[^.]+$/, '.jpg'), {
        type: 'image/jpeg',
      });
    }

    setStatusText(`${prefix}アップロード中...`);
    const fd = new FormData();
    fd.append('password', getPassword());
    fd.append('filmId', filmId);
    fd.append('file', fileToUpload);

    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const ct = res.headers.get('content-type') || '';
    let data: { filename?: string; error?: string } = {};
    if (ct.includes('application/json')) {
      data = await res.json();
    } else if (!res.ok) {
      if (res.status === 413) throw new Error('圧縮後もファイルサイズが大きすぎます');
      throw new Error(`サーバーエラー (${res.status})`);
    }
    if (!res.ok) throw new Error(data.error || 'アップロード失敗');
    return data.filename!;
  }

  async function handleFiles(fileList: FileList) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    const uploaded: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round((i / files.length) * 100));
      try {
        const filename = await uploadSingle(files[i], i + 1, files.length);
        uploaded.push(filename);
      } catch (e) {
        errors.push(`${files[i].name}: ${(e as Error).message}`);
      }
    }

    setProgress(100);
    setTimeout(() => {
      setUploading(false);
      setProgress(0);
      setStatusText('');
    }, 400);
    if (inputRef.current) inputRef.current.value = '';

    if (uploaded.length > 0) await onUpload(uploaded);
    if (errors.length > 0) alert(`アップロードエラー:\n${errors.join('\n')}`);
  }

  return (
    <div>
      <div
        className={`upload-zone${dragOver ? ' drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled && !uploading) handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={disabled || uploading}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="upload-zone-icon">📁</div>
        <div className="upload-zone-text">
          <strong>タップして選択</strong> またはドロップ
        </div>
        <div className="upload-zone-hint">複数選択可 · JPG / PNG / WebP · 大きなファイルは自動圧縮</div>
      </div>
      {uploading && (
        <div className="upload-progress">
          <div className="upload-progress-bar">
            <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="upload-progress-text">{statusText || 'アップロード中...'}</div>
        </div>
      )}
    </div>
  );
}

/* ── Film Settings Form ── */
function FilmSettings({
  film,
  onChange,
}: {
  film: Film;
  onChange: (filmId: string, field: keyof Film, value: unknown) => void;
}) {
  const hasWarning = film.warning !== null && film.warning !== undefined;
  const [warningOn, setWarningOn] = useState(hasWarning);

  return (
    <div className="settings-form">
      <div className="form-field">
        <label className="form-label">キャッチコピー</label>
        <textarea
          className="form-textarea"
          rows={2}
          value={film.catchcopy}
          onChange={(e) => onChange(film.id, 'catchcopy', e.target.value)}
        />
      </div>
      <div className="form-field">
        <label className="form-label">追加料金 (₩)</label>
        <input
          type="number"
          className="form-input"
          value={film.price_extra}
          min={0}
          step={1000}
          onChange={(e) => onChange(film.id, 'price_extra', parseInt(e.target.value, 10) || 0)}
        />
      </div>
      <div className="form-field">
        <div className="form-row">
          <button
            type="button"
            className={`form-toggle${warningOn ? ' on' : ''}`}
            onClick={() => {
              const next = !warningOn;
              setWarningOn(next);
              onChange(film.id, 'warning', next ? (film.warning || '') : null);
            }}
          />
          <span className="form-toggle-label">注意文を表示</span>
        </div>
        {warningOn && (
          <textarea
            className="form-textarea"
            rows={2}
            style={{ marginTop: 8 }}
            placeholder="注意文を入力..."
            value={film.warning || ''}
            onChange={(e) => onChange(film.id, 'warning', e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

/* ── Film Admin Card ── */
function FilmAdminCard({
  film,
  onDelete,
  onUpload,
  onReorder,
  onSettingsChange,
  onFilmDelete,
}: {
  film: Film;
  onDelete: (filmId: string, filename: string) => void;
  onUpload: (filmId: string, filenames: string[]) => Promise<void>;
  onReorder: (filmId: string, newPhotos: string[]) => void;
  onSettingsChange: (filmId: string, field: keyof Film, value: unknown) => void;
  onFilmDelete: (filmId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="film-admin-card">
      <div className="film-admin-header" onClick={() => setOpen((o) => !o)}>
        <div>
          <div className="film-admin-name">{film.name_jp}</div>
          <div className="film-admin-meta">
            {film.name_en} · {film.photos.length}枚
          </div>
        </div>
        <svg
          className={`film-admin-chevron${open ? ' open' : ''}`}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <div className={`film-admin-body${open ? ' open' : ''}`}>
        <div>
          <div className="admin-section-label">写真</div>
          <ThumbnailGrid film={film} onDelete={onDelete} onReorder={onReorder} />
        </div>
        <UploadZone
          filmId={film.id}
          onUpload={(filenames) => onUpload(film.id, filenames)}
          disabled={false}
        />
        <div>
          <div className="admin-section-label">設定</div>
          <FilmSettings film={film} onChange={onSettingsChange} />
        </div>
        <div>
          <button
            className="btn-film-delete"
            onClick={() => onFilmDelete(film.id)}
            disabled={film.photos.length > 0}
            title={film.photos.length > 0 ? '写真をすべて削除してください' : 'フィルムを削除'}
          >
            このフィルムを削除する
          </button>
          {film.photos.length > 0 && (
            <div className="film-delete-hint">写真をすべて削除するとフィルムを削除できます</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Film Add Form ── */
function FilmAddForm({
  onAdd,
  onClose,
}: {
  onAdd: (filmData: Film) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    id: '',
    name_jp: '',
    name_en: '',
    price_extra: 0 as 0 | 5000 | 10000,
    is_bw: false,
    catchcopy: '',
    tags: { color: '', grain: '', scene: '' },
    warning: '',
  });
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function setTag(key: keyof typeof form.tags, value: string) {
    setForm((p) => ({ ...p, tags: { ...p.tags, [key]: value } }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id.trim() || !form.name_jp.trim()) {
      setError('IDとフィルム名は必須です');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(form.id)) {
      setError('IDは小文字英数字とハイフンのみ');
      return;
    }
    onAdd({
      ...form,
      id: form.id.trim(),
      photos: [],
      warning: form.warning.trim() || null,
    });
  }

  return (
    <div className="film-add-overlay" onClick={onClose}>
      <div className="film-add-card" onClick={(e) => e.stopPropagation()}>
        <div className="film-add-header">
          <span>フィルムを追加</span>
          <button className="modal-close" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="film-add-form">
          {error && <div className="login-error">{error}</div>}
          {(
            [
              { label: 'ID (英小文字・数字)', field: 'id' as const, placeholder: '例: portra160' },
              { label: 'フィルム名 (日本語)', field: 'name_jp' as const, placeholder: '例: コダック ポートラ160' },
              { label: 'フィルム名 (英語)', field: 'name_en' as const, placeholder: 'Kodak Portra 160' },
            ] as const
          ).map(({ label, field, placeholder }) => (
            <div className="form-field" key={field}>
              <label className="form-label">{label}</label>
              <input
                className="form-input"
                value={form[field]}
                onChange={(e) => set(field, e.target.value as never)}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="form-field">
            <label className="form-label">追加料金</label>
            <select
              className="form-input"
              value={form.price_extra}
              onChange={(e) => set('price_extra', Number(e.target.value) as 0 | 5000 | 10000)}
            >
              {PRICE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p === 0 ? '無料' : `₩${p.toLocaleString()}`}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <div className="form-row">
              <button
                type="button"
                className={`form-toggle${form.is_bw ? ' on' : ''}`}
                onClick={() => set('is_bw', !form.is_bw)}
              />
              <span className="form-toggle-label">白黒フィルム</span>
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">キャッチコピー</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={form.catchcopy}
              onChange={(e) => set('catchcopy', e.target.value)}
            />
          </div>
          {(
            [
              { label: 'タグ — 色調', key: 'color' as const, placeholder: '例: 自然な色調' },
              { label: 'タグ — 粒子', key: 'grain' as const, placeholder: '例: 粒子細かめ' },
              { label: 'タグ — シーン', key: 'scene' as const, placeholder: '例: 日中屋外' },
            ] as const
          ).map(({ label, key, placeholder }) => (
            <div className="form-field" key={key}>
              <label className="form-label">{label}</label>
              <input
                className="form-input"
                value={form.tags[key]}
                onChange={(e) => setTag(key, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="form-field">
            <label className="form-label">注意文 (任意)</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={form.warning}
              onChange={(e) => set('warning', e.target.value)}
            />
          </div>
          <button type="submit" className="btn-save" style={{ marginTop: 4 }}>
            追加する
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Admin Screen ── */
function AdminScreen({
  initialConfig,
  password,
  onLogout,
  showToast,
}: {
  initialConfig: GalleryConfig;
  password: string;
  onLogout: () => void;
  showToast: (msg: string, type?: string) => void;
}) {
  const [config, setConfigState] = useState(initialConfig);
  const configRef = useRef(initialConfig);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  function setConfig(next: GalleryConfig) {
    configRef.current = next;
    setConfigState(next);
  }

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  async function saveConfig(cfg: GalleryConfig) {
    setSaving(true);
    try {
      const res = await fetch('/api/config-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, config: cfg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存失敗');
      showToast('保存しました');
      setIsDirty(false);
    } catch (e) {
      showToast(`エラー: ${(e as Error).message}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(filmId: string, filenames: string[]) {
    const list = Array.isArray(filenames) ? filenames : [filenames];
    const next: GalleryConfig = {
      ...configRef.current,
      films: configRef.current.films.map((f) =>
        f.id === filmId ? { ...f, photos: [...f.photos, ...list] } : f,
      ),
    };
    setConfig(next);
    const msg = list.length > 1 ? `${list.length}枚をアップロードしました` : `${list[0]} をアップロードしました`;
    showToast(msg);
    await saveConfig(next);
  }

  async function handleReorder(filmId: string, newPhotos: string[]) {
    const next: GalleryConfig = {
      ...configRef.current,
      films: configRef.current.films.map((f) =>
        f.id === filmId ? { ...f, photos: newPhotos } : f,
      ),
    };
    setConfig(next);
    await saveConfig(next);
  }

  async function handleDelete(filmId: string, filename: string) {
    if (!confirm(`「${filename}」を削除しますか？`)) return;
    try {
      const delRes = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, filmId, filename }),
      });
      if (!delRes.ok) {
        const err = await delRes.json();
        showToast(`削除失敗: ${err.error}`, 'error');
        return;
      }
    } catch (e) {
      showToast(`削除エラー: ${(e as Error).message}`, 'error');
      return;
    }
    const next: GalleryConfig = {
      ...configRef.current,
      films: configRef.current.films.map((f) =>
        f.id === filmId ? { ...f, photos: f.photos.filter((p) => p !== filename) } : f,
      ),
    };
    setConfig(next);
    showToast(`${filename} を削除しました`);
    await saveConfig(next);
  }

  function handleSettingsChange(filmId: string, field: keyof Film, value: unknown) {
    const next: GalleryConfig = {
      ...configRef.current,
      films: configRef.current.films.map((f) =>
        f.id === filmId ? { ...f, [field]: value } : f,
      ),
    };
    setConfig(next);
    setIsDirty(true);
  }

  async function handleFilmAdd(filmData: Film) {
    if (configRef.current.films.some((f) => f.id === filmData.id)) {
      alert(`ID「${filmData.id}」はすでに使用されています`);
      return;
    }
    const next: GalleryConfig = {
      ...configRef.current,
      films: [...configRef.current.films, filmData],
    };
    setConfig(next);
    setShowAddForm(false);
    showToast(`${filmData.name_jp} を追加しました`);
    await saveConfig(next);
  }

  async function handleFilmDelete(filmId: string) {
    const film = configRef.current.films.find((f) => f.id === filmId);
    if (!film) return;
    if (film.photos.length > 0) {
      alert('写真をすべて削除してからフィルムを削除してください');
      return;
    }
    if (!confirm(`「${film.name_jp}」を削除しますか？この操作は取り消せません。`)) return;
    const next: GalleryConfig = {
      ...configRef.current,
      films: configRef.current.films.filter((f) => f.id !== filmId),
    };
    setConfig(next);
    showToast(`${film.name_jp} を削除しました`);
    await saveConfig(next);
  }

  const groups = [
    { price: 0, label: '追加料金なし', films: config.films.filter((f) => f.price_extra === 0) },
    { price: 5000, label: '₩5,000', films: config.films.filter((f) => f.price_extra === 5000) },
    { price: 10000, label: '₩10,000', films: config.films.filter((f) => f.price_extra === 10000) },
  ];

  return (
    <>
      <div className="admin-header">
        <div
          style={{
            padding: '0',
            maxWidth: 700,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <span className="admin-header-title">管理画面</span>
          <button className="btn-logout" onClick={onLogout}>
            ログアウト
          </button>
        </div>
      </div>

      <div className="admin-wrap">
        {groups.map(({ price, label, films }) =>
          films.length === 0 ? null : (
            <div key={price}>
              <div className="admin-section-label">{label}</div>
              {films.map((film) => (
                <FilmAdminCard
                  key={film.id}
                  film={film}
                  onDelete={handleDelete}
                  onUpload={handleUpload}
                  onReorder={handleReorder}
                  onSettingsChange={handleSettingsChange}
                  onFilmDelete={handleFilmDelete}
                />
              ))}
            </div>
          ),
        )}

        <button className="btn-add-film" onClick={() => setShowAddForm(true)}>
          ＋ フィルムを追加
        </button>

        {isDirty && (
          <button className="btn-save" onClick={() => saveConfig(config)} disabled={saving}>
            {saving ? '保存中...' : '設定を保存する'}
          </button>
        )}
      </div>

      {showAddForm && (
        <FilmAddForm onAdd={handleFilmAdd} onClose={() => setShowAddForm(false)} />
      )}
    </>
  );
}

/* ── App Root ── */
export default function AdminApp() {
  const [password, setPassword] = useState('');
  const [config, setConfig] = useState<GalleryConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    const saved = getPassword();
    if (saved) setPassword(saved);
  }, []);

  useEffect(() => {
    if (!password) return;
    fetch('/api/config-read')
      .then((r) => {
        if (!r.ok) throw new Error('config 読み込み失敗');
        return r.json();
      })
      .then(setConfig)
      .catch((e: Error) => {
        setLoadError(e.message);
        setPassword('');
        sessionStorage.removeItem('adminPassword');
      });
  }, [password]);

  function handleLogin(pw: string) {
    setPassword(pw);
  }

  function handleLogout() {
    sessionStorage.removeItem('adminPassword');
    setPassword('');
    setConfig(null);
  }

  if (!password) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        <ToastContainer />
      </>
    );
  }

  if (loadError) {
    return (
      <div className="loading-wrap">
        エラー: {loadError}
      </div>
    );
  }

  if (!config) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
        読み込み中...
      </div>
    );
  }

  return (
    <>
      <AdminScreen
        initialConfig={config}
        password={password}
        onLogout={handleLogout}
        showToast={showToast}
      />
      <ToastContainer />
    </>
  );
}
