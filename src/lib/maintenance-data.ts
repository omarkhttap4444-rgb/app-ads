import 'server-only';
import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type MaintenanceAreaItem = {
  id: string;
  name_ar: string;
  governorate: string;
};

export type MaintenanceSpecialtyItem = {
  id: string;
  title_ar: string;
};

export type PublicMaintenanceCenter = {
  id: string;
  name: string;
  logo_url: string | null;
  cover_url: string | null;
  gallery_images: string[];
  area_id: string;
  governorate: string;
  area_name_ar: string | null;
  landmark_or_mall: string | null;
  detailed_address: string;
  latitude: number | null;
  longitude: number | null;
  primary_phone: string;
  whatsapp_number: string | null;
  working_hours_text: string;
  available_spare_parts: string | null;
  warranty_text: string | null;
  center_bio: string | null;
  service_perks: string[];
  supported_brands: string[];
  all_brands: boolean;
  is_verified: boolean;
  is_featured_active: boolean;
  average_rating: number;
  reviews_count: number;
  updated_at: string | null;
  specialty_ids: string[];
  specialty_titles: string[];
};

export const PERK_LABELS_AR: Record<string, string> = {
  free_diagnosis: 'فحص وتشخيص مجاني',
  instant_repair: 'صيانة فورية أمام العميل',
  pickup_delivery: 'مندوب استلام وتسليم',
};

export function normalizeEgyptWhatsApp(phone?: string | null): string | null {
  const digits = (phone ?? '').replace(/\D+/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('20') && digits.length >= 11) return digits;
  if (digits.startsWith('01') && digits.length === 11) return `20${digits.slice(1)}`;
  if (digits.startsWith('1') && digits.length === 10) return `20${digits}`;
  if (digits.startsWith('02') && digits.length >= 9) return `20${digits.slice(1)}`;
  return digits;
}

function parseSupportedBrands(raw: unknown): { allBrands: boolean; brands: string[] } {
  let obj = raw;
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj);
    } catch {
      return { allBrands: false, brands: [] };
    }
  }
  if (!obj || typeof obj !== 'object') return { allBrands: false, brands: [] };
  const record = obj as Record<string, unknown>;
  const allBrands = record.all_brands === true;
  const brandsObj = record.brands;
  const brands =
    brandsObj && typeof brandsObj === 'object'
      ? Object.keys(brandsObj as Record<string, unknown>).filter((k) => k.trim().length > 0)
      : [];
  return { allBrands, brands };
}

function mapCenterRow(
  row: Record<string, unknown>,
  areasMap: Map<string, MaintenanceAreaItem>,
  specsByCenter: Map<string, { ids: string[]; titles: string[] }>,
): PublicMaintenanceCenter {
  const id = String(row.id ?? '');
  const areaId = String(row.area_id ?? '');
  const area = areasMap.get(areaId);
  const specJoin = specsByCenter.get(id);
  const { allBrands, brands } = parseSupportedBrands(row.supported_models_json);

  const gallery = Array.isArray(row.gallery_images)
    ? row.gallery_images.map((u) => String(u ?? '').trim()).filter(Boolean)
    : [];
  const perks = Array.isArray(row.service_perks)
    ? row.service_perks.map((p) => String(p ?? '').trim()).filter(Boolean)
    : [];

  return {
    id,
    name: String(row.name ?? '').trim(),
    logo_url: row.logo_url ? String(row.logo_url).trim() : null,
    cover_url: row.cover_url ? String(row.cover_url).trim() : null,
    gallery_images: gallery,
    area_id: areaId,
    governorate: area?.governorate || String(row.governorate ?? 'القاهرة'),
    area_name_ar: area?.name_ar || (row.area_name_ar ? String(row.area_name_ar) : null),
    landmark_or_mall: row.landmark_or_mall ? String(row.landmark_or_mall).trim() : null,
    detailed_address: String(row.detailed_address ?? '').trim(),
    latitude: typeof row.latitude === 'number' ? row.latitude : null,
    longitude: typeof row.longitude === 'number' ? row.longitude : null,
    primary_phone: String(row.primary_phone ?? '').trim(),
    whatsapp_number: row.whatsapp_number ? String(row.whatsapp_number).trim() : null,
    working_hours_text: String(row.working_hours_text ?? 'يومياً: 11:00 ص - 11:00 م').trim(),
    available_spare_parts: row.available_spare_parts ? String(row.available_spare_parts).trim() : null,
    warranty_text: row.warranty_text ? String(row.warranty_text).trim() : null,
    center_bio: row.center_bio ? String(row.center_bio).trim() : null,
    service_perks: perks,
    supported_brands: brands,
    all_brands: allBrands,
    is_verified: Boolean(row.is_verified),
    is_featured_active: Boolean(row.is_featured_active),
    average_rating: Number(row.average_rating ?? 0),
    reviews_count: Number(row.reviews_count ?? 0),
    updated_at: row.updated_at ? String(row.updated_at) : null,
    specialty_ids: specJoin?.ids ?? [],
    specialty_titles: specJoin?.titles ?? [],
  };
}

async function fetchMaintenanceDirectoryUncached(): Promise<{
  centers: PublicMaintenanceCenter[];
  areas: MaintenanceAreaItem[];
  specialties: MaintenanceSpecialtyItem[];
}> {
  const [centersRes, areasRes, specialtiesRes] = await Promise.all([
    supabase
      .from('maintenance_centers_public')
      .select('*')
      .order('is_featured_active', { ascending: false })
      .order('is_verified', { ascending: false })
      .order('average_rating', { ascending: false })
      .limit(120),
    supabase
      .from('maintenance_areas')
      .select('id, name_ar, governorate')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('maintenance_specialties')
      .select('id, title_ar')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  const areas: MaintenanceAreaItem[] = ((areasRes.data ?? []) as Array<Record<string, unknown>>)
    .map((r) => ({
      id: String(r.id ?? ''),
      name_ar: String(r.name_ar ?? '').trim(),
      governorate: String(r.governorate ?? 'القاهرة').trim(),
    }))
    .filter((a) => a.id && a.name_ar);

  const areasMap = new Map<string, MaintenanceAreaItem>(areas.map((a) => [a.id, a]));

  const specialties: MaintenanceSpecialtyItem[] = (
    (specialtiesRes.data ?? []) as Array<Record<string, unknown>>
  )
    .map((r) => ({
      id: String(r.id ?? ''),
      title_ar: String(r.title_ar ?? '').trim(),
    }))
    .filter((s) => s.id && s.title_ar);

  const rawCenters = (centersRes.data ?? []) as Array<Record<string, unknown>>;
  const centerIds = rawCenters.map((c) => String(c.id ?? '')).filter(Boolean);

  const specsByCenter = new Map<string, { ids: string[]; titles: string[] }>();
  if (centerIds.length > 0) {
    const { data: links } = await supabase
      .from('maintenance_center_specialties')
      .select('center_id, specialty_id, maintenance_specialties(title_ar)')
      .in('center_id', centerIds);

    for (const row of (links ?? []) as Array<Record<string, unknown>>) {
      const cId = String(row.center_id ?? '');
      const sId = String(row.specialty_id ?? '');
      const joined = row.maintenance_specialties as { title_ar?: string } | null;
      const title = String(joined?.title_ar ?? '').trim();
      if (!cId) continue;
      const entry = specsByCenter.get(cId) ?? { ids: [], titles: [] };
      if (sId && !entry.ids.includes(sId)) entry.ids.push(sId);
      if (title && !entry.titles.includes(title)) entry.titles.push(title);
      specsByCenter.set(cId, entry);
    }
  }

  const centers = rawCenters
    .map((row) => mapCenterRow(row, areasMap, specsByCenter))
    .filter((c) => c.id && c.name);

  return { centers, areas, specialties };
}

export const getCachedMaintenanceDirectory = unstable_cache(
  fetchMaintenanceDirectoryUncached,
  ['souqphone-maintenance-directory-v1'],
  { revalidate: 180, tags: ['maintenance-directory'] },
);

export async function getCachedMaintenanceCenterById(
  id: string,
): Promise<PublicMaintenanceCenter | null> {
  const { centers } = await getCachedMaintenanceDirectory();
  return centers.find((c) => c.id === id) ?? null;
}
