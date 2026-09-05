"use client";

interface DailyViewsChartProps {
  data: { date: string; views: number }[];
}

export function DailyViewsChart({ data }: DailyViewsChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No data for this period.</p>;
  }

  const width = 600;
  const height = 200;
  const padding = 24;
  const maxViews = Math.max(...data.map((d) => d.views), 1);
  const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = padding + i * step;
    const y = height - padding - (d.views / maxViews) * (height - padding * 2);
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-48 text-blue-600"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Daily views from ${data[0].date} to ${data[data.length - 1].date}, peaking at ${maxViews.toLocaleString()} views`}
      >
        <polyline fill="none" stroke="currentColor" strokeWidth="2" points={polylinePoints} />
        {points.map((p, i) => (
          <circle key={data[i].date} cx={p.x} cy={p.y} r="2.5" fill="currentColor" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>{data[0].date}</span>
        <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  );
}
