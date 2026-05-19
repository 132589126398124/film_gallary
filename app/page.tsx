import { readFile } from 'fs/promises';
import path from 'path';
import type { GalleryConfig } from '@/lib/types';
import GalleryClient from '@/components/gallery/GalleryClient';

export const revalidate = 60;

export default async function GalleryPage() {
  let config: GalleryConfig;
  try {
    const raw = await readFile(path.join(process.cwd(), 'gallery-config.json'), 'utf-8');
    config = JSON.parse(raw);
  } catch {
    config = { films: [] };
  }
  return <GalleryClient initialConfig={config} />;
}
