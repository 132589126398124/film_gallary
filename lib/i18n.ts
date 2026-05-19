import type { Lang, PriceGroup } from './types';

export interface I18nStrings {
  desc: string;
  noticeTitle: string;
  noticeText: string;
  cta: string;
  follow: string;
  footer: string;
  free: string;
  nophotos: string;
  seeAll: (n: number) => string;
  sections: Record<PriceGroup, string>;
  close: string;
  loadError: string;
  langBtn: string;
}

export const I18N: Record<Lang, I18nStrings> = {
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

export const IG_URL = 'https://www.instagram.com/i.think.i.left.the.stove.on/';
export const CTA_URL = 'https://linktr.ee/i.think.i.left.the.stove.on?utm_source=film_gallery&utm_medium=website&utm_campaign=cta';
