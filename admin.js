const { useState, useEffect, useRef, useCallback } = React;

// ── Helpers ──────────────────────────────────────────────

const PRICE_OPTIONS = [0, 5000, 10000];

function getPassword() {
  return sessionStorage.getItem('adminPassword') || '';
}

// ── Toast ────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}

// ── Login screen ─────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
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

// ── Thumbnail grid ───────────────────────────────────────

function ThumbnailGrid({ film, onDelete, onReorder }) {
  const dragIdx = useRef(null);
  const [overIdx, setOverIdx] = useState(null);

  if (film.photos.length === 0) {
    return <div className="thumb-empty">まだ写真がありません</div>;
  }

  function movePhoto(from, to) {
    if (to < 0 || to >= film.photos.length) return;
    const next = [...film.photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(film.id, next);
  }

  function handleDragStart(i) { dragIdx.current = i; }
  function handleDragOver(e, i) { e.preventDefault(); setOverIdx(i); }
  function handleDragEnd() { dragIdx.current = null; setOverIdx(null); }
  function handleDrop(i) {
    const from = dragIdx.current;
    if (from === null || from === i) { setOverIdx(null); return; }
    movePhoto(from, i);
    dragIdx.current = null;
    setOverIdx(null);
  }

  return (
    <div className="thumb-grid">
      {film.photos.map((filename, i) => (
        <div
          className={`thumb-item${overIdx === i ? ' drag-over' : ''}`}
          key={filename}
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDrop={() => handleDrop(i)}
          onDragEnd={handleDragEnd}
          onDragLeave={() => setOverIdx(null)}
        >
          <img
            src={`/images/${film.id}/${filename}`}
            alt={`${film.name_jp} ${i + 1}`}
          />
          <button
            className="thumb-delete"
            onClick={() => onDelete(film.id, filename)}
            title="削除"
          >
            ×
          </button>
          <div className="thumb-drag-handle">⠿</div>
          {/* 모바일용 이동 버튼 */}
          <div className="thumb-move-btns">
            <button
              className="thumb-move"
              disabled={i === 0}
              onClick={() => movePhoto(i, i - 1)}
              title="前へ"
            >‹</button>
            <button
              className="thumb-move"
              disabled={i === film.photos.length - 1}
              onClick={() => movePhoto(i, i + 1)}
              title="次へ"
            >›</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Upload zone ──────────────────────────────────────────

const MAX_UPLOAD_BYTES = 4.3 * 1024 * 1024;

async function compressImage(file) {
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
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const qualities = [0.95, 0.88, 0.80, 0.70, 0.60, 0.50, 0.40];
      let idx = 0;
      function tryNext() {
        if (idx >= qualities.length) {
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.40);
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

function UploadZone({ filmId, onUpload, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const inputRef = useRef(null);

  async function uploadSingle(file, current, total) {
    const prefix = total > 1 ? `${current}/${total} ` : '';

    let fileToUpload = file;
    if (file.size > MAX_UPLOAD_BYTES) {
      setStatusText(`${prefix}圧縮中...`);
      const compressed = await compressImage(file);
      fileToUpload = new File([compressed], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
    }

    setStatusText(`${prefix}アップロード中...`);
    const fd = new FormData();
    fd.append('password', getPassword());
    fd.append('filmId', filmId);
    fd.append('file', fileToUpload);

    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const ct = res.headers.get('content-type') || '';
    let data = {};
    if (ct.includes('application/json')) {
      data = await res.json();
    } else if (!res.ok) {
      if (res.status === 413) throw new Error('圧縮後もファイルサイズが大きすぎます');
      throw new Error(`サーバーエラー (${res.status})`);
    }
    if (!res.ok) throw new Error(data.error || 'アップロード失敗');
    return data.filename;
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    const uploaded = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round((i / files.length) * 100));
      try {
        const filename = await uploadSingle(files[i], i + 1, files.length);
        uploaded.push(filename);
      } catch (e) {
        errors.push(`${files[i].name}: ${e.message}`);
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
          onChange={(e) => handleFiles(e.target.files)}
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

// ── Film settings form ───────────────────────────────────

function FilmSettings({ film, onChange }) {
  const hasWarning = film.warning !== null && film.warning !== undefined;
  const [warningOn, setWarningOn] = useState(hasWarning);

  function handleWarningToggle() {
    const next = !warningOn;
    setWarningOn(next);
    onChange(film.id, 'warning', next ? (film.warning || '') : null);
  }

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
            onClick={handleWarningToggle}
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

// ── Film admin card (accordion) ──────────────────────────

function FilmAdminCard({ film, onDelete, onUpload, onReorder, onSettingsChange }) {
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
        <UploadZone filmId={film.id} onUpload={(filenames) => onUpload(film.id, filenames)} />
        <div>
          <div className="admin-section-label">設定</div>
          <FilmSettings film={film} onChange={onSettingsChange} />
        </div>
      </div>
    </div>
  );
}

// ── Main admin screen ────────────────────────────────────

function AdminScreen({ initialConfig, password, onLogout, showToast }) {
  const [config, setConfigState] = useState(initialConfig);
  const configRef = useRef(initialConfig);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // configRef를 항상 최신 config와 동기화
  // setState side-effect 없이 최신 상태를 동기적으로 읽기 위함
  function setConfig(next) {
    configRef.current = next;
    setConfigState(next);
  }

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  async function saveConfig(cfg) {
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
      showToast(`エラー: ${e.message}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  // Upload: add filenames to photos, save once
  async function handleUpload(filmId, filenames) {
    const list = Array.isArray(filenames) ? filenames : [filenames];
    const next = {
      ...configRef.current,
      films: configRef.current.films.map((f) =>
        f.id === filmId ? { ...f, photos: [...f.photos, ...list] } : f
      ),
    };
    setConfig(next);
    const msg = list.length > 1 ? `${list.length}枚をアップロードしました` : `${list[0]} をアップロードしました`;
    showToast(msg);
    await saveConfig(next);
  }

  // Reorder: update photos array order, immediately save config
  async function handleReorder(filmId, newPhotos) {
    const next = {
      ...configRef.current,
      films: configRef.current.films.map((f) =>
        f.id === filmId ? { ...f, photos: newPhotos } : f
      ),
    };
    setConfig(next);
    await saveConfig(next);
  }

  // Delete: remove from photos array, immediately save config
  async function handleDelete(filmId, filename) {
    if (!confirm(`「${filename}」を削除しますか？`)) return;
    const next = {
      ...configRef.current,
      films: configRef.current.films.map((f) =>
        f.id === filmId ? { ...f, photos: f.photos.filter((p) => p !== filename) } : f
      ),
    };
    setConfig(next);
    showToast(`${filename} を削除しました`);
    await saveConfig(next);
  }

  // Settings change: mark dirty (explicit save required)
  function handleSettingsChange(filmId, field, value) {
    setConfig((prev) => ({
      ...prev,
      films: prev.films.map((f) =>
        f.id === filmId ? { ...f, [field]: value } : f
      ),
    }));
    setIsDirty(true);
  }

  // Group films by price for display
  const groups = [
    { price: 0, label: '追加料金なし', films: config.films.filter((f) => f.price_extra === 0) },
    { price: 5000, label: '₩5,000', films: config.films.filter((f) => f.price_extra === 5000) },
    { price: 10000, label: '₩10,000', films: config.films.filter((f) => f.price_extra === 10000) },
  ];

  return (
    <>
      <div
        className="admin-header"
        style={{ position: 'sticky', top: 0, zIndex: 100 }}
      >
        <div className="admin-wrap" style={{ padding: '0 16px', maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span className="admin-header-title">管理画面</span>
          <button className="btn-logout" onClick={onLogout}>ログアウト</button>
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
                />
              ))}
            </div>
          )
        )}

        {isDirty && (
          <button
            className="btn-save"
            onClick={() => saveConfig(config)}
            disabled={saving}
          >
            {saving ? '保存中...' : '設定を保存する'}
          </button>
        )}
      </div>
    </>
  );
}

// ── App root ─────────────────────────────────────────────

function App() {
  const [password, setPassword] = useState(getPassword);
  const [config, setConfig] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const { showToast, ToastContainer } = useToast();

  // Load config when authenticated
  useEffect(() => {
    if (!password) return;
    fetch('/api/config-read')
      .then((r) => {
        if (!r.ok) throw new Error('config 読み込み失敗');
        return r.json();
      })
      .then(setConfig)
      .catch((e) => {
        setLoadError(e.message);
        setPassword('');
        sessionStorage.removeItem('adminPassword');
      });
  }, [password]);

  function handleLogin(pw) {
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

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

