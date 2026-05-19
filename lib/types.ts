export interface FilmTags {
  color: string;
  grain: string;
  scene: string;
}

export interface Film {
  id: string;
  name_jp: string;
  name_en: string;
  price_extra: 0 | 5000 | 10000;
  catchcopy: string;
  tags: FilmTags;
  is_bw: boolean;
  warning: string | null;
  photos: string[];
}

export interface GalleryConfig {
  films: Film[];
}

export type Lang = 'ja' | 'ko';

export type PriceGroup = 0 | 5000 | 10000;
