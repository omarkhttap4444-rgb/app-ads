export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="aspect-square shimmer" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-3.5 shimmer rounded-lg w-3/4" />
        <div className="flex gap-1.5">
          <div className="h-5 shimmer rounded-md w-12" />
          <div className="h-5 shimmer rounded-md w-10" />
        </div>
        <div className="h-5 shimmer rounded-lg w-1/2 mt-2" />
        <div className="h-3 shimmer rounded-lg w-1/3 mt-1" />
      </div>
    </div>
  );
}

export function ProductCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="w-full h-[200px] sm:h-[260px] md:h-[340px] lg:h-[380px] shimmer rounded-2xl" />
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-14 h-14 rounded-full shimmer" />
      <div className="h-3 shimmer rounded w-12" />
    </div>
  );
}

export function CategorySkeletonGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CategorySkeleton key={i} />
      ))}
    </div>
  );
}
