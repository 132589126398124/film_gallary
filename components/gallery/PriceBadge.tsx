'use client';

import type { I18nStrings } from '@/lib/i18n';
import type { PriceGroup } from '@/lib/types';

interface Props {
  price: PriceGroup;
  t: I18nStrings;
}

export default function PriceBadge({ price, t }: Props) {
  if (price === 0) return <span className="price-badge free">{t.free}</span>;
  const cls = price === 5000 ? 'mid' : 'high';
  return <span className={`price-badge ${cls}`}>+₩{price.toLocaleString()}</span>;
}
