'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Film, GalleryConfig, PriceGroup } from '@/lib/types';
import { I18N, IG_URL, CTA_URL, type I18nStrings } from '@/lib/i18n';
import type { Lang } from '@/lib/types';
import FilmCard from './FilmCard';
import FilmModal from './FilmModal';

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const PRICE_GROUPS: PriceGroup[] = [0, 5000, 10000];

interface Props {
  initialConfig: GalleryConfig;
}

export default function GalleryClient({ initialConfig }: Props) {
  const [lang, setLang] = useState<Lang>('ja');
  const [films, setFilms] = useState<Film[]>([]);
  const [error, setError] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);

  const t: I18nStrings = I18N[lang];

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'ja' || saved === 'ko') setLang(saved);
  }, []);

  useEffect(() => {
    try {
      const sorted = [...initialConfig.films].sort((a, b) => {
        if (a.price_extra !== b.price_extra) return a.price_extra - b.price_extra;
        return (a.is_bw ? 1 : 0) - (b.is_bw ? 1 : 0);
      });
      setFilms(sorted);
    } catch {
      setError(true);
    }
  }, [initialConfig]);

  useEffect(() => {
    if (films.length === 0) return;
    const cards = document.querySelectorAll<HTMLElement>('[data-card]');
    const observer = new IntersectionObserver(
      (entries) => {
        const gridMap = new Map<Element | null, HTMLElement[]>();
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const grid = entry.target.closest('.film-grid');
          if (!gridMap.has(grid)) gridMap.set(grid, []);
          gridMap.get(grid)!.push(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        });
        gridMap.forEach((visibleCards) => {
          visibleCards.forEach((card, i) =>
            setTimeout(() => card.classList.add('visible'), i * 60),
          );
        });
      },
      { threshold: 0.08 },
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [films]);

  function toggleLang() {
    const next: Lang = lang === 'ja' ? 'ko' : 'ja';
    setLang(next);
    localStorage.setItem('lang', next);
    document.documentElement.lang = next;
  }

  const handleSelect = useCallback((film: Film) => setSelectedFilm(film), []);
  const handleClose = useCallback(() => setSelectedFilm(null), []);

  const groups: Record<PriceGroup, Film[]> = { 0: [], 5000: [], 10000: [] };
  films.forEach((f) => {
    if (groups[f.price_extra as PriceGroup] !== undefined) {
      groups[f.price_extra as PriceGroup].push(f);
    }
  });

  return (
    <div className="page-wrap">
      <div className="film-strip-bar" aria-hidden="true" />

      <header className="site-header">
        <div className="header-top-row">
          <div className="header-handle">@i.think.i.left.the.stove.on</div>
          <button className="lang-toggle" onClick={toggleLang}>
            {t.langBtn}
          </button>
        </div>
        <p className="header-desc">
          {t.desc.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i === 0 && <br />}
            </span>
          ))}
        </p>
        <a className="header-ig" href={IG_URL} target="_blank" rel="noopener noreferrer">
          <InstagramIcon />
          @i.think.i.left.the.stove.on
        </a>
        <hr className="header-divider" />
      </header>

      <div className="notice-banner">
        <span className="notice-icon">📷</span>
        <div className="notice-body">
          <div className="notice-title">{t.noticeTitle}</div>
          <div className="notice-text">{t.noticeText}</div>
        </div>
      </div>

      {error ? (
        <div style={{ padding: '24px 0', color: 'var(--tan)', fontSize: 14 }}>
          {t.loadError}
        </div>
      ) : (
        <>
          {PRICE_GROUPS.map((price) =>
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
            ) : null,
          )}
          {selectedFilm && (
            <FilmModal film={selectedFilm} onClose={handleClose} t={t} />
          )}
        </>
      )}

      <footer className="site-footer">
        <hr className="header-divider" style={{ marginBottom: 4 }} />
        <a className="cta-button" href={CTA_URL} target="_blank" rel="noopener noreferrer">
          {t.cta}
        </a>
        <a className="footer-ig" href={IG_URL} target="_blank" rel="noopener noreferrer">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
