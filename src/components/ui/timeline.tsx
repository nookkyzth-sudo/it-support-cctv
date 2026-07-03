import type { TicketLog } from "@/types";

const statusColor: Record<string, string> = {
  Pending: "bg-red-500",
  In_Progress: "bg-yellow-500",
  Claim: "bg-yellow-500",
  Resolved: "bg-green-500",
};

const statusLabel: Record<string, string> = {
  Pending: "รอรับงาน",
  In_Progress: "กำลังดำเนินการ",
  Claim: "เคลม",
  Resolved: "เสร็จสิ้น",
};

export function Timeline({ logs }: { logs: TicketLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-gray-400">ยังไม่มีประวัติ</p>;
  }

  return (
    <div className="relative space-y-4">
      {logs.map((log, i) => (
        <div key={log.log_id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full mt-1 ${
                statusColor[log.new_status] || "bg-gray-400"
              }`}
            />
            {i < logs.length - 1 && (
              <div className="w-px h-full bg-gray-200" />
            )}
          </div>
          <div className="pb-4">
            <p className="text-sm font-medium text-gray-900">
              {statusLabel[log.new_status] || log.new_status.replace("_", " ")}
              {log.old_status && ` (จาก ${statusLabel[log.old_status] || log.old_status.replace("_", " ")})`}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(log.changed_at).toLocaleString("th-TH", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {log.note && (
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                {log.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
