'use client';

import { useState, useEffect, useRef } from 'react';
import type { Film } from '@/lib/types';
import type { I18nStrings } from '@/lib/i18n';
import PriceBadge from './PriceBadge';

interface LightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

function Lightbox({ src, alt, onClose }: LightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="閉じる">
        ✕
      </button>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
      <img
        className="lightbox-img"
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

interface Props {
  film: Film;
  onClose: () => void;
  t: I18nStrings;
}

export default function FilmModal({ film, onClose, t }: Props) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState('');
  const lightboxRef = useRef<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
  const titleId = `modal-title-${film.id}`;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    lightboxRef.current = lightboxSrc;
  }, [lightboxSrc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (lightboxRef.current) setLightboxSrc(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy < 0) return;
    touchDeltaY.current = dy;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`;
  }

  function handleTouchEnd() {
    if (sheetRef.current) {
      sheetRef.current.style.transition = '';
      sheetRef.current.style.transform = '';
    }
    if (touchDeltaY.current > 100) onClose();
  }

  return (
    <>
      <div
        className="modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div
          className="modal-sheet"
          ref={sheetRef}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="modal-swipe-bar" aria-hidden="true" />
          <div className="modal-header">
            <div>
              <div className="modal-title" id={titleId}>
                {film.name_jp}
              </div>
              <div className="modal-subtitle">{film.name_en}</div>
            </div>
            <button
              ref={closeRef}
              className="modal-close"
              onClick={onClose}
              aria-label={t.close}
            >
              ✕
            </button>
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
                <div className="film-warning">
                  <strong>⚠ 注意：</strong>
                  {film.warning}
                </div>
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
                    <div
                      className="modal-photo"
                      key={filename}
                      onClick={() => {
                        setLightboxSrc(src);
                        setLightboxAlt(alt);
                      }}
                    >
                      <img src={src} alt={alt} loading="lazy" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} alt={lightboxAlt} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  );
}
