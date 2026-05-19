'use client';

import type { Film } from '@/lib/types';
import type { I18nStrings } from '@/lib/i18n';
import PriceBadge from './PriceBadge';

interface Props {
  film: Film;
  onSelect: (film: Film) => void;
  t: I18nStrings;
}

function PhotoGrid({ film, t }: { film: Film; t: I18nStrings }) {
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

export default function FilmCard({ film, onSelect, t }: Props) {
  const hasPhotos = film.photos.length > 0;

  function handleActivate() {
    if (hasPhotos) onSelect(film);
  }

  return (
    <div
      className={`film-card${film.is_bw ? ' mono-film' : ''}${hasPhotos ? ' has-photos' : ''}`}
      data-card
      onClick={handleActivate}
      role={hasPhotos ? 'button' : undefined}
      tabIndex={hasPhotos ? 0 : undefined}
      onKeyDown={
        hasPhotos
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleActivate();
              }
            }
          : undefined
      }
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
        {film.warning && (
          <div className="film-warning">
            <strong>⚠ 注意：</strong>
            {film.warning}
          </div>
        )}
        {hasPhotos && <div className="film-more-hint">{t.seeAll(film.photos.length)}</div>}
      </div>
    </div>
  );
}
