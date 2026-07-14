import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";

const colorMap = {
  red: { 
    bg: "bg-red-50", 
    text: "text-red-600", 
    iconBg: "bg-red-100",
    icon: AlertCircle,
    trend: "text-red-500",
    trendBg: "bg-red-50"
  },
  yellow: { 
    bg: "bg-yellow-50", 
    text: "text-yellow-600", 
    iconBg: "bg-yellow-100",
    icon: Clock,
    trend: "text-yellow-600",
    trendBg: "bg-yellow-50"
  },
  green: { 
    bg: "bg-green-50", 
    text: "text-green-500", 
    iconBg: "bg-green-100",
    icon: CheckCircle2,
    trend: "text-green-500",
    trendBg: "bg-green-50"
  },
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
  const Icon = c.icon;

  return (
    <div className="bg-white rounded-[20px] shadow-[0_18px_40px_rgba(112,144,176,0.12)] p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
      <div className="flex items-start justify-between z-10">
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <p className="text-4xl font-extrabold text-[#2B3674]">{count}</p>
        </div>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${c.bg}`}>
          <Icon size={28} className={c.text} strokeWidth={2.5} />
        </div>
      </div>
      
      {/* Decorative simple trend indicator to match reference style */}
      <div className="z-10 mt-4 flex items-center gap-2">
        <div className={`px-2 py-1 rounded-md text-xs font-bold ${c.trendBg} ${c.trend}`}>
          Total
        </div>
        <span className="text-xs text-gray-400 font-medium">รายการในระบบ</span>
      </div>
      
      {/* Subtle background decoration */}
      <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03]">
        <Icon size={120} />
      </div>
    </div>
  );
}
