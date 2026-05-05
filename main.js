const { useState, useEffect, useRef, useCallback } = React;

// ── i18n ──────────────────────────────────────────────────

const I18N = {
  ja: {
    desc: 'ソウル在住のアマチュアフィルム写真家。\nフィルムの種類ごとにサンプル写真を掲載しています。',
    noticeTitle: 'サンプル掲載状況について',
    noticeText: '現在、風景・街スナップのサンプルを順次追加中です。しばらくお待ちください。',
    cta: 'フィルム撮影について問い合わせる →',
    follow: '@i.think.i.left.the.stove.on をフォローする',
    footer: '© i.think.i.left.the.stove.on · Seoul Film Photographer',
    free: '無料',
    nophotos: '作例準備中',
    seeAll: (n) => `全${n}枚を見る →`,
    sections: { 0: '追加料金なし', 5000: '₩5,000', 10000: '₩10,000' },
    close: '閉じる',
    loadError: 'コンテンツを読み込めませんでした',
    langBtn: '한국어',
  },
  ko: {
    desc: '서울 거주 아마추어 필름 사진작가.\n필름 종류별 작례 사진을 소개합니다.',
    noticeTitle: '작례 게재 현황',
    noticeText: '현재 풍경·거리 스냅 사진을 순차 추가 중입니다. 잠시 기다려 주세요.',
    cta: '필름 촬영 문의하기 →',
    follow: '@i.think.i.left.the.stove.on 팔로우하기',
    footer: '© i.think.i.left.the.stove.on · Seoul Film Photographer',
    free: '무료',
    nophotos: '작례 준비 중',
    seeAll: (n) => `전체 ${n}장 보기 →`,
    sections: { 0: '추가 요금 없음', 5000: '₩5,000', 10000: '₩10,000' },
    close: '닫기',
    loadError: '콘텐츠를 불러오지 못했습니다',
    langBtn: '日本語',
  },
};

const IG_URL = 'https://www.instagram.com/i.think.i.left.the.stove.on/';
const CTA_URL = 'https://linktr.ee/i.think.i.left.the.stove.on?utm_source=film_gallery&utm_medium=website&utm_campaign=cta';

// ── Components ─────────────────────────────────────────────

function PhotoGrid({ film, t }) {
  const { photos, id, is_bw } = film;
  const phClass = `photo-placeholder${is_bw ? ' mono' : ''}`;

  if (photos.length === 0) {
    return (
      <div className="film-photos single">
        <div className="film-photo">
          <div className={phClass}>
            <span className="placeholder-text">{t.nophotos}</span>
          </div>
        </div>
      </div>
    );
  }

  let gridClass = 'film-photos';
  if (photos.length === 1) gridClass += ' single';
  else if (photos.length === 2) gridClass += ' two-col';

  const display = photos.length >= 3 ? photos.slice(0, 3) : photos;
  const extraCount = photos.length > 3 ? photos.length - 3 : 0;

  return (
    <div className={gridClass}>
      {display.map((filename, i) => (
        <div className="film-photo" key={filename}>
          <img
            src={`/images/${id}/${filename}`}
            alt={`${film.name_jp} sample ${i + 1}`}
            loading="lazy"
          />
          {i === 2 && extraCount > 0 && (
            <div className="photo-count-badge">+{extraCount}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function PriceBadge({ price, t }) {
  if (price === 0) return <span className="price-badge free">{t.free}</span>;
  const cls = price === 5000 ? 'mid' : 'high';
  return <span className={`price-badge ${cls}`}>+₩{price.toLocaleString()}</span>;
}

function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="閉じる">✕</button>
      <img className="lightbox-img" src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

function FilmModal({ film, onClose, t }) {
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [lightboxAlt, setLightboxAlt] = useState('');
  const lightboxRef = useRef(null);
  const closeRef = useRef(null);
  const sheetRef = useRef(null);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
  const titleId = `modal-title-${film.id}`;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => { lightboxRef.current = lightboxSrc; }, [lightboxSrc]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (lightboxRef.current) setLightboxSrc(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleTouchStart(e) {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  }
  function handleTouchMove(e) {
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy < 0) return;
    touchDeltaY.current = dy;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`;
  }
  function handleTouchEnd() {
    if (sheetRef.current) { sheetRef.current.style.transition = ''; sheetRef.current.style.transform = ''; }
    if (touchDeltaY.current > 100) onClose();
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          <div className="modal-swipe-bar" aria-hidden="true" />
          <div className="modal-header">
            <div>
              <div className="modal-title" id={titleId}>{film.name_jp}</div>
              <div className="modal-subtitle">{film.name_en}</div>
            </div>
            <button ref={closeRef} className="modal-close" onClick={onClose} aria-label={t.close}>✕</button>
          </div>
          <div className="modal-body">
            <div className="modal-film-info">
              <p className="modal-catchcopy">{film.catchcopy}</p>
              <div className="modal-tags">
                <span className="tag tone">{film.tags.color}</span>
                <span className="tag grain">{film.tags.grain}</span>
                <span className="tag scene">{film.tags.scene}</span>
                <PriceBadge price={film.price_extra} t={t} />
              </div>
              {film.warning && (
                <div className="film-warning"><strong>⚠ 注意：</strong>{film.warning}</div>
              )}
            </div>
            {film.photos.length === 0 ? (
              <div className="modal-empty">{t.nophotos}</div>
            ) : (
              <div className="modal-photo-grid">
                {film.photos.map((filename, i) => {
                  const src = `/images/${film.id}/${filename}`;
                  const alt = `${film.name_jp} ${i + 1}`;
                  return (
                    <div className="modal-photo" key={filename}
                      onClick={() => { setLightboxSrc(src); setLightboxAlt(alt); }}>
                      <img src={src} alt={alt} loading="lazy" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {lightboxSrc && <Lightbox src={lightboxSrc} alt={lightboxAlt} onClose={() => setLightboxSrc(null)} />}
    </>
  );
}

function FilmCard({ film, onSelect, t }) {
  const hasPhotos = film.photos.length > 0;
  function handleActivate() { if (hasPhotos) onSelect(film); }

  return (
    <div
      className={`film-card${film.is_bw ? ' mono-film' : ''}${hasPhotos ? ' has-photos' : ''}`}
      data-card
      onClick={handleActivate}
      role={hasPhotos ? 'button' : undefined}
      tabIndex={hasPhotos ? 0 : undefined}
      onKeyDown={hasPhotos ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleActivate(); } } : undefined}
      aria-label={hasPhotos ? `${film.name_jp} の作例を見る` : undefined}
    >
      <PhotoGrid film={film} t={t} />
      <div className="film-body">
        <div className="film-name-row">
          <span className="film-name-jp">{film.name_jp}</span>
          <PriceBadge price={film.price_extra} t={t} />
        </div>
        <div className="film-name-en">{film.name_en}</div>
        <div className="film-catchcopy">{film.catchcopy}</div>
        <div className="film-tags">
          <span className="tag tone">{film.tags.color}</span>
          <span className="tag grain">{film.tags.grain}</span>
          <span className="tag scene">{film.tags.scene}</span>
        </div>
        {film.warning && <div className="film-warning"><strong>⚠ 注意：</strong>{film.warning}</div>}
        {hasPhotos && <div className="film-more-hint">{t.seeAll(film.photos.length)}</div>}
      </div>
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ja');
  const [films, setFilms] = useState([]);
  const [error, setError] = useState(null);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const t = I18N[lang];

  function toggleLang() {
    const next = lang === 'ja' ? 'ko' : 'ja';
    setLang(next);
    localStorage.setItem('lang', next);
    document.documentElement.lang = next;
  }

  const handleSelect = useCallback((film) => setSelectedFilm(film), []);
  const handleClose = useCallback(() => setSelectedFilm(null), []);

  useEffect(() => {
    fetch('/gallery-config.json')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        const sorted = [...data.films].sort((a, b) => {
          if (a.price_extra !== b.price_extra) return a.price_extra - b.price_extra;
          return (a.is_bw ? 1 : 0) - (b.is_bw ? 1 : 0);
        });
        setFilms(sorted);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (films.length === 0) return;
    const cards = document.querySelectorAll('[data-card]');
    const observer = new IntersectionObserver((entries) => {
      const gridMap = new Map();
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const grid = entry.target.closest('.film-grid');
        if (!gridMap.has(grid)) gridMap.set(grid, []);
        gridMap.get(grid).push(entry.target);
        observer.unobserve(entry.target);
      });
      gridMap.forEach((visibleCards) => {
        visibleCards.forEach((card, i) => setTimeout(() => card.classList.add('visible'), i * 60));
      });
    }, { threshold: 0.08 });
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [films]);

  const groups = { 0: [], 5000: [], 10000: [] };
  films.forEach((f) => { if (groups[f.price_extra] !== undefined) groups[f.price_extra].push(f); });

  return (
    <div className="page-wrap">
      {/* 헤더 */}
      <header className="site-header">
        <div className="header-top-row">
          <div className="header-handle">@i.think.i.left.the.stove.on</div>
          <button className="lang-toggle" onClick={toggleLang}>{t.langBtn}</button>
        </div>
        <p className="header-desc">
          {t.desc.split('\n').map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}
        </p>
        <a className="header-ig" href={IG_URL} target="_blank" rel="noopener">
          <InstagramIcon />
          @i.think.i.left.the.stove.on
        </a>
        <hr className="header-divider" />
      </header>

      {/* 공지 배너 */}
      <div className="notice-banner">
        <span className="notice-icon">📷</span>
        <div className="notice-body">
          <div className="notice-title">{t.noticeTitle}</div>
          <div className="notice-text">{t.noticeText}</div>
        </div>
      </div>

      {/* 갤러리 */}
      {error ? (
        <div style={{ padding: '24px 0', color: '#6B7280', fontSize: 14 }}>{t.loadError}</div>
      ) : (
        <>
          {[0, 5000, 10000].map((price) =>
            groups[price].length > 0 ? (
              <section key={price}>
                <div className="section-label">
                  <span className="section-label-text">{t.sections[price]}</span>
                  <span className="section-label-line" />
                </div>
                <div className="film-grid">
                  {groups[price].map((film) => (
                    <FilmCard key={film.id} film={film} onSelect={handleSelect} t={t} />
                  ))}
                </div>
              </section>
            ) : null
          )}
          {selectedFilm && <FilmModal film={selectedFilm} onClose={handleClose} t={t} />}
        </>
      )}

      {/* 푸터 */}
      <footer className="site-footer">
        <hr className="header-divider" style={{ marginBottom: 4 }} />
        <a className="cta-button" href={CTA_URL} target="_blank" rel="noopener">{t.cta}</a>
        <a className="footer-ig" href={IG_URL} target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          {t.follow}
        </a>
        <p className="footer-legal">{t.footer}</p>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('gallery-root')).render(<App />);
