const colorMap = {
  red: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  green: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
};

export function KpiWidget({
  title,
  count,
  color,
}: {
  title: string;
  count: number;
  color: keyof typeof colorMap;
}) {
  const c = colorMap[color];

  return (
    <div className={`${c.bg} rounded-xl p-5`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${c.dot}`} />
        <span className={`text-sm font-medium ${c.text}`}>{title}</span>
      </div>
      <p className={`text-3xl font-bold ${c.text}`}>{count}</p>
    </div>
  );
}
