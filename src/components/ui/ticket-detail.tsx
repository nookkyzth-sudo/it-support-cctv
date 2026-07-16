"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTicketStatus } from "@/app/actions/tickets";
import { Timeline } from "./timeline";
import { formatDateTime } from "@/lib/format";
import type { Ticket } from "@/types";

const statusBadge: Record<string, string> = {
  Pending: "bg-red-100 text-red-700",
  In_Progress: "bg-yellow-100 text-yellow-700",
  Claim: "bg-yellow-100 text-yellow-700",
  Resolved: "bg-green-100 text-green-700",
};

const statusLabel: Record<string, string> = {
  Pending: "รอรับงาน",
  In_Progress: "กำลังดำเนินการ",
  Claim: "เคลม",
  Resolved: "แก้ไขเรียบร้อย",
};

export function TicketDetail({ ticket }: { ticket: Ticket }) {
  const router = useRouter();
  const [note, setNote] = useState(ticket.technician_note || "");
  const [technicianName, setTechnicianName] = useState(ticket.technician?.name || "");
  const [logDate, setLogDate] = useState(() => {
    const date = new Date();
    return date.toISOString().slice(0, 10);
  });
  const [saving, setSaving] = useState(false);

  const canChangeStatus = ticket.status !== "Resolved";
  const canEditProgress = ticket.status !== "Pending" && ticket.status !== "Resolved";
  const repairLogs = ticket.logs || [];

  async function handleStatusChange(newStatus: string) {
    setSaving(true);
    try {
      const statusOnly = ticket.status === "Pending" && newStatus === "In_Progress";
      await updateTicketStatus(
        ticket.ticket_id,
        newStatus,
        statusOnly ? undefined : note,
        technicianName,
        logDate,
        statusOnly
      );
      router.refresh();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  async function handleSaveProgress() {
    setSaving(true);
    try {
      await updateTicketStatus(ticket.ticket_id, ticket.status, note, technicianName, logDate);
      router.refresh();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            #{ticket.ticket_id} - {ticket.branch?.branch_name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            แจ้งเมื่อ {formatDateTime(ticket.report_date)}
          </p>
        </div>
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            statusBadge[ticket.status] || ""
          }`}
        >
          {statusLabel[ticket.status] || ticket.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-white rounded-xl p-5 border border-gray-200">
        <div>
          <p className="text-xs text-gray-500">สาขา</p>
          <p className="font-medium">{ticket.branch?.branch_name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">ประเภทอุปกรณ์</p>
          <p className="font-medium">{ticket.category?.category_name}</p>
        </div>
        {ticket.technician && (
          <div>
            <p className="text-xs text-gray-500">ช่างผู้รับผิดชอบ</p>
            <p className="font-medium">{ticket.technician.name}</p>
          </div>
        )}
        {ticket.resolved_date && (
          <div>
            <p className="text-xs text-gray-500">วันที่ปิดงาน</p>
            <p className="font-medium">
              {new Date(ticket.resolved_date).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-2">รายละเอียดอาการ</h2>
        <p className="text-gray-700 whitespace-pre-wrap">
          {ticket.issue_description}
        </p>
      </div>

      {ticket.attachments && ticket.attachments.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-3">รูปภาพ</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ticket.attachments.map((att) => (
              <div key={att.attachment_id}>
                <img
                  src={att.file_path}
                  alt={att.type}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {att.type === "before" ? "ก่อนซ่อม" : "หลังซ่อม"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {canChangeStatus && (
        <div className="bg-white rounded-xl p-5 border border-gray-200 space-y-4">
          <h2 className="font-semibold text-gray-900">จัดการสถานะ</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ผู้รับผิดชอบ
              </label>
              <input
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                placeholder="กรอกชื่อผู้รับผิดชอบ"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันที่บันทึก
              </label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              บันทึกความคืบหน้า
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              disabled={!canEditProgress}
              placeholder="อัพเดทงานวันนี้หรือแก้ไขข้อมูลย้อนหลัง..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none disabled:bg-gray-100 disabled:text-gray-500"
            />
            {!canEditProgress && (
              <p className="mt-1 text-xs text-amber-700">กรุณากด &quot;รับงาน&quot; ก่อน จึงจะเริ่มบันทึกความคืบหน้าได้</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSaveProgress}
              disabled={saving || !canEditProgress}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              บันทึกความคืบหน้า
            </button>
            {ticket.status === "Pending" && (
              <button
                onClick={() => handleStatusChange("In_Progress")}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                รับงาน (In Progress)
              </button>
            )}
            {(ticket.status === "In_Progress" || ticket.status === "Claim") && (
              <>
                <button
                  onClick={() => handleStatusChange("Claim")}
                  disabled={saving}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
                >
                  ระบุเคลม (Claim)
                </button>
                <button
                  onClick={() => handleStatusChange("Resolved")}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  ปิดงาน (Resolved)
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-3">รายละเอียดการซ่อมทั้งหมด</h2>
        {repairLogs.length > 0 ? (
          <div className="space-y-4">
            {repairLogs.map((log) => (
              <div key={log.log_id} className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {log.old_status
                        ? `${statusLabel[log.old_status] || log.old_status.replace("_", " ")} → ${statusLabel[log.new_status] || log.new_status.replace("_", " ")}`
                        : `${statusLabel[log.new_status] || log.new_status.replace("_", " ")}`}
                    </p>
                    {log.note ? (
                      <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{log.note}</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1 italic">ไม่มีบันทึกเพิ่มเติม</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.changed_at).toLocaleString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-700">ยังไม่มีรายละเอียดการซ่อม</p>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-3">Timeline</h2>
        <Timeline logs={ticket.logs || []} />
      </div>
    </div>
  );
}
