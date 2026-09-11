import { isRemoteMediaUrl } from '@/lib/media';

export type ProductImageRow = {
  image_url?: string | null;
  position?: number | null;
};

export function orderedProductImages(
  rows: ProductImageRow[] | null | undefined,
) {
  return [...(rows ?? [])].sort(
    (left, right) =>
      (left.position ?? Number.MAX_SAFE_INTEGER) -
      (right.position ?? Number.MAX_SAFE_INTEGER),
  );
}

export function productImageUrls(
  rows: ProductImageRow[] | null | undefined,
) {
  return orderedProductImages(rows)
    .map((image) => image.image_url)
    .filter(isRemoteMediaUrl);
}

export function firstProductImageUrl(
  rows: ProductImageRow[] | null | undefined,
) {
  return productImageUrls(rows)[0];
}
