// Phone brands/models catalog — fetched from the SAME Supabase tables the
// Flutter app uses (phone_brands + phone_models), so the web add-listing form
// always matches the app exactly.
import { supabase } from '@/lib/supabase';

export type PhoneCatalog = {
  brands: string[];
  modelsByBrand: Record<string, string[]>;
};

const OTHER = 'أخرى';

export async function fetchPhoneCatalog(): Promise<PhoneCatalog> {
  const [brandsRes, modelsRes] = await Promise.all([
    supabase
      .from('phone_brands')
      .select('id, name')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('phone_models')
      .select('id, brand_id, name')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
  ]);

  const brandRows = (brandsRes.data ?? []) as { id: string; name: string }[];
  const modelRows = (modelsRes.data ?? []) as {
    id: string;
    brand_id: string;
    name: string;
  }[];

  const brands = brandRows
    .map((b) => (b.name ?? '').trim())
    .filter((n) => n.length > 0);

  const modelsByBrand: Record<string, string[]> = {};
  const brandNameById = new Map(brandRows.map((b) => [b.id, (b.name ?? '').trim()]));
  for (const m of modelRows) {
    const brandName = brandNameById.get(m.brand_id);
    const modelName = (m.name ?? '').trim();
    if (!brandName || !modelName) continue;
    (modelsByBrand[brandName] ??= []).push(modelName);
  }

  // The app appends "أخرى" after the DB list (phone_specs_section.dart:250)
  return { brands: [...brands, OTHER], modelsByBrand };
}

// ─── Series grouping (ported from lib/data/phone_data.dart) ────────────────

type SeriesDefinition = { title: string; keywords: string[] };

const SERIES_DEFINITIONS: Record<string, SeriesDefinition[]> = {
  'آبل': [
    { title: 'iPhone 18', keywords: ['آيفون 18'] },
    { title: 'iPhone 17', keywords: ['آيفون 17'] },
    { title: 'iPhone 16', keywords: ['آيفون 16'] },
    { title: 'iPhone 15', keywords: ['آيفون 15'] },
    { title: 'iPhone 14', keywords: ['آيفون 14'] },
    { title: 'iPhone SE', keywords: ['se'] },
    { title: 'iPhone أقدم', keywords: ['آيفون 13', 'آيفون 12', 'آيفون 11', 'آيفون x'] },
  ],
  'سامسونج': [
    { title: 'Galaxy S', keywords: ['جالاكسي s'] },
    { title: 'Galaxy A', keywords: ['جالاكسي a'] },
    { title: 'Galaxy M', keywords: ['جالاكسي m'] },
    { title: 'Galaxy F', keywords: ['جالاكسي f'] },
    { title: 'Galaxy Z Fold', keywords: ['z فولد'] },
    { title: 'Galaxy Z Flip', keywords: ['z فليب'] },
    { title: 'Galaxy Note', keywords: ['نوت'] },
  ],
  'شاومي': [
    { title: 'Xiaomi الرئيسية', keywords: ['شاومي '] },
    { title: 'Redmi Note', keywords: ['ريدمي نوت'] },
    { title: 'Redmi', keywords: ['ريدمي '] },
    { title: 'POCO X', keywords: ['بوكو x'] },
    { title: 'POCO F', keywords: ['بوكو f'] },
    { title: 'POCO M', keywords: ['بوكو m'] },
    { title: 'POCO C', keywords: ['بوكو c'] },
  ],
  'أوبو': [
    { title: 'Find X', keywords: ['فايند x'] },
    { title: 'Find N', keywords: ['فايند n'] },
    { title: 'Reno', keywords: ['رينو'] },
    { title: 'A Series', keywords: ['أوبو a', 'a'] },
  ],
  'ريلمي': [
    { title: 'GT', keywords: ['gt'] },
    {
      title: 'Number Series',
      keywords: ['ريلمي 16', 'ريلمي 15', 'ريلمي 14', 'ريلمي 13', 'ريلمي 12', 'ريلمي 11', 'ريلمي 10', 'ريلمي 9'],
    },
    { title: 'C Series', keywords: ['ريلمي c'] },
    { title: 'Narzo', keywords: ['نارزو'] },
  ],
  'هواوي': [
    { title: 'Pura / P', keywords: ['بورا', 'p'] },
    { title: 'Mate', keywords: ['ميت'] },
    { title: 'Nova', keywords: ['نوفا'] },
    { title: 'Y Series', keywords: ['y'] },
  ],
  'إنفينيكس': [
    { title: 'Zero', keywords: ['زيرو'] },
    { title: 'Note', keywords: ['نوت'] },
    { title: 'Hot', keywords: ['هوت'] },
    { title: 'Smart', keywords: ['سمارت'] },
  ],
  'نوكيا': [
    { title: 'X Series', keywords: ['x'] },
    { title: 'G Series', keywords: ['g'] },
    { title: 'C Series', keywords: ['c'] },
    { title: 'Classic', keywords: ['نوكيا'] },
  ],
  'فيفو': [
    { title: 'X Series', keywords: ['x'] },
    { title: 'V Series', keywords: ['v'] },
    { title: 'Y Series', keywords: ['y'] },
    { title: 'T Series', keywords: ['t'] },
  ],
  'ون بلس': [
    { title: 'OnePlus الرئيسية', keywords: ['ون بلس 14', 'ون بلس 13', 'ون بلس 12', 'ون بلس 11', 'ون بلس 10', 'ون بلس 9'] },
    { title: 'Nord', keywords: ['نورد'] },
    { title: 'Open', keywords: ['open'] },
  ],
  'جوجل بيكسل': [
    { title: 'Pixel الرئيسية', keywords: ['بيكسل 10', 'بيكسل 9', 'بيكسل 8', 'بيكسل 7', 'بيكسل 6'] },
    { title: 'Pixel Fold', keywords: ['فولد'] },
  ],
  'تكنو': [
    { title: 'Phantom', keywords: ['فانتوم'] },
    { title: 'Camon', keywords: ['كامون'] },
    { title: 'Spark', keywords: ['سبارك'] },
    { title: 'Pova', keywords: ['بوفا'] },
    { title: 'Pop', keywords: ['بوب'] },
  ],
  'هونر': [
    { title: 'Magic', keywords: ['ماجيك'] },
    {
      title: 'Number Series',
      keywords: ['هونر 400', 'هونر 300', 'هونر 200', 'هونر 100', 'هونر 90', 'هونر 80', 'هونر 70', 'هونر 60', 'هونر 50'],
    },
    { title: 'X Series', keywords: ['هونر x'] },
    { title: 'Play', keywords: ['بلاي'] },
  ],
  'سوني': [
    { title: 'Xperia 1', keywords: ['إكسبيريا 1'] },
    { title: 'Xperia 5', keywords: ['إكسبيريا 5'] },
    { title: 'Xperia 10', keywords: ['إكسبيريا 10'] },
    { title: 'Xperia Pro', keywords: ['برو'] },
  ],
  'موتورولا': [
    { title: 'Edge', keywords: ['edge'] },
    { title: 'Razr', keywords: ['razr'] },
    { title: 'Moto G', keywords: ['g'] },
    { title: 'Moto E', keywords: ['e'] },
  ],
};

export type PhoneModelGroup = { title: string; models: string[] };

function dedupe(models: string[]): string[] {
  return [...new Set(models)];
}

export function getModelGroupsForBrand(
  brand: string,
  sourceModels: string[],
): PhoneModelGroup[] {
  if (sourceModels.length === 0) return [];

  const definitions = SERIES_DEFINITIONS[brand];
  if (!definitions || definitions.length === 0) {
    return [{ title: 'الموديلات', models: dedupe(sourceModels) }];
  }

  const used = new Set<string>();
  const groups: PhoneModelGroup[] = [];

  for (const definition of definitions) {
    const groupedModels: string[] = [];
    for (const model of sourceModels) {
      if (!used.has(model) && definition.keywords.some((k) => model.toLowerCase().includes(k.toLowerCase()))) {
        groupedModels.push(model);
        used.add(model);
      }
    }
    if (groupedModels.length > 0) {
      groups.push({ title: definition.title, models: groupedModels });
    }
  }

  const remaining = sourceModels.filter((m) => !used.has(m));
  if (remaining.length > 0) {
    groups.push({ title: 'موديلات أخرى', models: dedupe(remaining) });
  }

  return groups;
}

// ─── Option lists (exact copies from lib/data/phone_data.dart) ─────────────

export const RAM_OPTIONS = ['2', '3', '4', '6', '8', '12', '16', '18', '24'];

export const STORAGE_OPTIONS = ['32', '64', '128', '256', '512', '1 تيرا'];

export type PhoneColorOption = { name: string; hex: string };

export const PHONE_COLORS: PhoneColorOption[] = [
  { name: 'أسود', hex: '#000000' },
  { name: 'أبيض', hex: '#FFFFFF' },
  { name: 'رمادي', hex: '#9E9E9E' },
  { name: 'فضي', hex: '#607D8B' },
  { name: 'ذهبي', hex: '#FFD700' },
  { name: 'أزرق', hex: '#2196F3' },
  { name: 'أزرق فاتح', hex: '#03A9F4' },
  { name: 'أخضر', hex: '#4CAF50' },
  { name: 'أخضر فاتح', hex: '#8BC34A' },
  { name: 'أحمر', hex: '#F44336' },
  { name: 'نحاسي', hex: '#B87333' },
  { name: 'بنفسجي', hex: '#9C27B0' },
  { name: 'وردي', hex: '#E91E63' },
  { name: 'كحلي', hex: '#001F54' },
  { name: 'برتقالي', hex: '#FF9800' },
];

export const ACCESSORIES_OPTIONS = [
  'شاحن وسماعه',
  'شاحن',
  'سماعه',
  'علبه بجميع الملحقات',
  'بدون ملحقات',
];
