"use client";

import Link from "next/link";
import { formatDate } from "@/lib/format";
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
  Resolved: "เสร็จสิ้น",
};

export function TicketTable({ tickets }: { tickets: Ticket[] }) {
  const downloadCsv = () => {
    const headers = [
      "วันที่แจ้ง",
      "สาขา",
      "อุปกรณ์",
      "อาการ",
      "วันที่ซ่อม",
      "สถานะ",
      "แก้ไข",
      "หมายเหตุ",
    ];

    const rows: string[][] = [];
    for (const ticket of tickets) {
      const firstBase = [
        formatDate(ticket.report_date),
        ticket.branch?.branch_name || "",
        ticket.category?.category_name || "",
        ticket.issue_description,
        ticket.resolved_date ? formatDate(ticket.resolved_date) : "-",
        statusLabel[ticket.status] || ticket.status,
      ];
      const extraBase = ["", "", "", "",
        ticket.resolved_date ? formatDate(ticket.resolved_date) : "-",
        statusLabel[ticket.status] || ticket.status,
      ];
      const notes = (ticket.logs || []).filter((l) => l.note?.trim());
      if (notes.length === 0) {
        rows.push([...firstBase, "", ""]);
      } else {
        notes.forEach((l, i) => {
          rows.push([...(i === 0 ? firstBase : extraBase), l.note!.trim(), ""]);
        });
      }
    }

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `it-support-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async () => {
    const XLSX = await import("xlsx");
    const data: Record<string, string>[] = [];
    for (const ticket of tickets) {
      const firstBase = {
        "วันที่แจ้ง": formatDate(ticket.report_date),
        สาขา: ticket.branch?.branch_name || "",
        อุปกรณ์: ticket.category?.category_name || "",
        อาการ: ticket.issue_description,
        "วันที่ซ่อม": ticket.resolved_date ? formatDate(ticket.resolved_date) : "-",
        สถานะ: statusLabel[ticket.status] || ticket.status,
      };
      const extraBase = {
        "วันที่แจ้ง": "",
        สาขา: "",
        อุปกรณ์: "",
        อาการ: "",
        "วันที่ซ่อม": ticket.resolved_date ? formatDate(ticket.resolved_date) : "-",
        สถานะ: statusLabel[ticket.status] || ticket.status,
      };
      const notes = (ticket.logs || []).filter((l) => l.note?.trim());
      if (notes.length === 0) {
        data.push({ ...firstBase, "แก้ไข": "", "หมายเหตุ": "" });
      } else {
        notes.forEach((l, i) => {
          data.push({ ...(i === 0 ? firstBase : extraBase), "แก้ไข": l.note!.trim(), "หมายเหตุ": "" });
        });
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(
      workbook,
      `it-support-report-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        ไม่พบรายการแจ้งซ่อม
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
        <button
          type="button"
          onClick={downloadCsv}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ส่งออก CSV
        </button>
        <button
          type="button"
          onClick={downloadExcel}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          ส่งออก Excel
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-500">สาขา</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">อุปกรณ์</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">อาการ</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">วันที่ซ่อม</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">สถานะ</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">วันที่แจ้ง</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">แก้ไข</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">หมายเหตุ</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.ticket_id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 px-4">{ticket.branch?.branch_name}</td>
              <td className="py-3 px-4">{ticket.category?.category_name}</td>
              <td className="py-3 px-4 max-w-xs truncate">
                {ticket.issue_description}
              </td>
              <td className="py-3 px-4 text-gray-500">
                {ticket.resolved_date ? formatDate(ticket.resolved_date) : "-"}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadge[ticket.status] || ""}`}
                >
                  {statusLabel[ticket.status] || ticket.status.replace("_", " ")}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-500">
                {formatDate(ticket.report_date)}
              </td>
              <td className="py-3 px-4 text-gray-600 max-w-xs">
                {(ticket.logs || []).filter((l) => l.note?.trim()).length > 0 ? (
                  <ul className="space-y-1">
                    {(ticket.logs || []).filter((l) => l.note?.trim()).map((l) => (
                      <li key={l.log_id} className="text-xs whitespace-pre-wrap">{l.note!.trim()}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4">
                {ticket.status === "Pending" ? (
                  <Link
                    href={`/tickets/${ticket.ticket_id}`}
                    className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    รับงาน
                  </Link>
                ) : (
                  <Link
                    href={`/tickets/${ticket.ticket_id}`}
                    className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    ดูรายละเอียด
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
