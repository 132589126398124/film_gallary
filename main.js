const { useState, useEffect, useRef } = React;

// Camera icon SVG
const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5">
    <rect x="3" y="6" width="18" height="14" rx="2"/>
    <circle cx="12" cy="13" r="4"/>
    <path d="M9 6V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/>
  </svg>
);

function PhotoGrid({ film }) {
  const { photos, id, is_bw } = film;
  const phClass = `photo-placeholder${is_bw ? ' mono' : ''}`;

  if (photos.length === 0) {
    return (
      <div className="film-photos single">
        <div className="film-photo">
          <div className={phClass}>
            <span className="placeholder-text">作例準備中</span>
          </div>
        </div>
      </div>
    );
  }

  let gridClass = 'film-photos';
  if (photos.length === 1) gridClass += ' single';
  else if (photos.length === 2) gridClass += ' two-col';

  const display = photos.length >= 3 ? photos.slice(0, 3) : photos;

  return (
    <div className={gridClass}>
      {display.map((filename, i) => (
        <div className="film-photo" key={i}>
          <img
            src={`/images/${id}/${filename}`}
            alt={`${film.name_jp} sample ${i + 1}`}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

function PriceBadge({ price }) {
  if (price === 0) return <span className="price-badge free">無料</span>;
  const cls = price === 5000 ? 'mid' : 'high';
  return <span className={`price-badge ${cls}`}>+₩{price.toLocaleString()}</span>;
}

function FilmCard({ film }) {
  const cardRef = useRef(null);

  return (
    <div
      className={`film-card${film.is_bw ? ' mono-film' : ''}`}
      data-card
      ref={cardRef}
    >
      <PhotoGrid film={film} />
      <div className="film-body">
        <div className="film-name-row">
          <span className="film-name-jp">{film.name_jp}</span>
          <PriceBadge price={film.price_extra} />
        </div>
        <div className="film-name-en">{film.name_en}</div>
        <div className="film-catchcopy">{film.catchcopy}</div>
        <div className="film-tags">
          <span className="tag tone">{film.tags.color}</span>
          <span className="tag grain">{film.tags.grain}</span>
          <span className="tag scene">{film.tags.scene}</span>
        </div>
        {film.warning && (
          <div className="film-warning">
            <strong>⚠ 注意：</strong>{film.warning}
          </div>
        )}
      </div>
    </div>
  );
}

const SECTION_LABELS = {
  0: '追加料金なし',
  5000: '₩5,000',
  10000: '₩10,000',
};

function FilmSection({ price, films }) {
  return (
    <section>
      <div className="section-label">
        <span className="section-label-text">{SECTION_LABELS[price]}</span>
        <span className="section-label-line"></span>
      </div>
      <div className="film-grid">
        {films.map((film) => (
          <FilmCard key={film.id} film={film} />
        ))}
      </div>
    </section>
  );
}

function Gallery() {
  const [films, setFilms] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/gallery-config.json')
      .then((r) => {
        if (!r.ok) throw new Error('config fetch failed');
        return r.json();
      })
      .then((data) => {
        const sorted = [...data.films].sort((a, b) => {
          if (a.price_extra !== b.price_extra) return a.price_extra - b.price_extra;
          return (a.is_bw ? 1 : 0) - (b.is_bw ? 1 : 0);
        });
        setFilms(sorted);
      })
      .catch((e) => setError(e.message));
  }, []);

  // Scroll animation: IntersectionObserver with 60ms stagger
  useEffect(() => {
    if (films.length === 0) return;

    const cards = document.querySelectorAll('[data-card]');
    const observer = new IntersectionObserver(
      (entries) => {
        // Group by parent grid for stagger
        const gridMap = new Map();
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const grid = entry.target.closest('.film-grid');
          if (!gridMap.has(grid)) gridMap.set(grid, []);
          gridMap.get(grid).push(entry.target);
          observer.unobserve(entry.target);
        });
        gridMap.forEach((visibleCards) => {
          visibleCards.forEach((card, i) => {
            setTimeout(() => card.classList.add('visible'), i * 60);
          });
        });
      },
      { threshold: 0.08 }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [films]);

  if (error) {
    return (
      <div style={{ padding: '24px 0', color: '#6B7280', fontSize: 14 }}>
        コンテンツを読み込めませんでした
      </div>
    );
  }

  // Group by price
  const groups = { 0: [], 5000: [], 10000: [] };
  films.forEach((f) => {
    if (groups[f.price_extra]) groups[f.price_extra].push(f);
  });

  return (
    <>
      {[0, 5000, 10000].map((price) =>
        groups[price].length > 0 ? (
          <FilmSection key={price} price={price} films={groups[price]} />
        ) : null
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('gallery-root')).render(<Gallery />);
