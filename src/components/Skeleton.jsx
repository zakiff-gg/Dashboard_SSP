export function SkeletonTable({ cols }) {
  return (
    <div className="skeleton-table">
      {[0, 1, 2, 3, 4].map((row) => (
        <div className="skeleton-row" key={row} style={{ animationDelay: `${row * 90}ms` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div className="skeleton-cell shimmer" key={c} />
          ))}
        </div>
      ))}
    </div>
  );
}
