import { motion } from "framer-motion";

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-secondary/50 rounded-xl ${className || ""}`} />
);

export const HomePageSkeleton = () => (
  <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto stagger-load">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12" />
        <div className="space-y-2">
          <Skeleton className="w-8 h-3" />
          <Skeleton className="w-24 h-6" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-14 h-6 rounded-full" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </div>
    <Skeleton className="w-full h-20 mb-8" />
    <div className="flex items-end justify-between mb-4 px-1">
      <Skeleton className="w-20 h-6" />
      <Skeleton className="w-24 h-4 rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-3 mb-6">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-full h-24" />)}
    </div>
    <Skeleton className="w-32 h-6 mb-3" />
    <div className="grid grid-cols-2 gap-4 mb-8">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-full h-28" />)}
    </div>
  </div>
);

export const FeedSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="glass rounded-2xl overflow-hidden p-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-16 h-3" />
          </div>
        </div>
        <Skeleton className="w-full aspect-square mb-4 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-2/3 h-4" />
        </div>
      </div>
    ))}
  </div>
);

export const WorkoutSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="w-full h-20 rounded-2xl" />
    {[1, 2, 3, 4].map(i => (
      <Skeleton key={i} className="w-full h-16 rounded-2xl" />
    ))}
  </div>
);
