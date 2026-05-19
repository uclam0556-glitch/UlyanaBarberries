export default function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card">
      <div className="aspect-product shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-4 shimmer rounded-md w-4/5" />
        <div className="h-3 shimmer rounded-md w-2/3" />
        <div className="h-3 shimmer rounded-md w-1/3" />
        <div className="flex items-center justify-between mt-3">
          <div className="h-5 shimmer rounded-md w-20" />
          <div className="h-8 w-8 shimmer rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
