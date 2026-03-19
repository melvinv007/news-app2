/**
 * components/ArticleGrid/SkeletonCard.tsx
 * ─────────────────────────────────────────────────────────────────
 * Shimmer loading placeholder matching the real ArticleCard dimensions.
 * Uses the .shimmer class from globals.css for the gradient sweep animation.
 *
 * How to adjust dimensions: Match changes in ArticleCard/index.tsx.
 * Used by: components/ArticleGrid/index.tsx
 */

export default function SkeletonCard(): React.ReactElement {
  return (
    <div
      className="rounded-xl p-4 md:p-5 flex flex-col gap-3"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Source chip skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full shimmer" />
        <div className="h-3 w-24 rounded shimmer" />
        <div className="h-3 w-12 rounded shimmer ml-auto" />
      </div>

      {/* Headline skeleton — 2 lines */}
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-full rounded shimmer" />
        <div className="h-4 w-3/4 rounded shimmer" />
      </div>

      {/* Summary skeleton — 2 lines */}
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-full rounded shimmer" />
        <div className="h-3 w-5/6 rounded shimmer" />
      </div>

      {/* Tags skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 rounded-full shimmer" />
        <div className="h-5 w-14 rounded-full shimmer" />
        <div className="h-5 w-12 rounded-full shimmer" />
      </div>

      {/* Action bar skeleton */}
      <div className="flex items-center gap-2 pt-1">
        <div className="w-8 h-8 rounded-lg shimmer" />
        <div className="w-8 h-8 rounded-lg shimmer" />
        <div className="w-8 h-8 rounded-lg shimmer" />
        <div className="w-8 h-8 rounded-lg shimmer" />
      </div>
    </div>
  );
}
