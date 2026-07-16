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
  Resolved: "แก้ไขเรียบร้อย",
};

type RepairRow = {
  ticket: Ticket;
  note: string | null;
  isFirst: boolean;
};

function buildRows(tickets: Ticket[]): RepairRow[] {
  const rows: RepairRow[] = [];
  for (const ticket of tickets) {
    const notes = (ticket.logs || []).filter((l) => l.note?.trim());
    if (notes.length === 0) {
      rows.push({ ticket, note: null, isFirst: true });
    } else {
      notes.forEach((l, i) => {
        rows.push({ ticket, note: l.note!.trim(), isFirst: i === 0 });
      });
    }
  }
  return rows;
}

export function RepairTable({ tickets }: { tickets: Ticket[] }) {
  const sortedTickets = [...tickets].sort((a, b) => {
    const aDate = new Date(a.report_date).getTime();
    const bDate = new Date(b.report_date).getTime();
    return aDate - bDate;
  });
  const rows = buildRows(sortedTickets);

  const downloadCsv = () => {
    const headers = ["วันที่แจ้ง", "สาขา", "ผู้แจ้ง", "อุปกรณ์", "อาการ", "วันที่ซ่อม", "สถานะ", "แก้ไข", "หมายเหตุ"];
    const csvRows: string[][] = [];
    for (const ticket of sortedTickets) {
      const firstBase = [
        formatDate(ticket.report_date),
        ticket.branch?.branch_name || "",
        ticket.reporter?.name || "-",
        ticket.category?.category_name || "",
        ticket.issue_description,
        ticket.resolved_date ? formatDate(ticket.resolved_date) : "-",
        statusLabel[ticket.status] || ticket.status,
      ];
      const extraBase = [
        "", "", "", "", "",
        ticket.resolved_date ? formatDate(ticket.resolved_date) : "-",
        statusLabel[ticket.status] || ticket.status,
      ];
      const notes = (ticket.logs || []).filter((l) => l.note?.trim());
      if (notes.length === 0) {
        csvRows.push([...firstBase, "", ""]);
      } else {
        notes.forEach((l, i) => {
          csvRows.push([...(i === 0 ? firstBase : extraBase), l.note!.trim(), ""]);
        });
      }
    }
    const csv = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `repair-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async () => {
    const XLSX = await import("xlsx");
    const data: Record<string, string>[] = [];
    for (const ticket of sortedTickets) {
      const firstBase = {
        "วันที่แจ้ง": formatDate(ticket.report_date),
        สาขา: ticket.branch?.branch_name || "",
        ผู้แจ้ง: ticket.reporter?.name || "-",
        อุปกรณ์: ticket.category?.category_name || "",
        อาการ: ticket.issue_description,
        "วันที่ซ่อม": ticket.resolved_date ? formatDate(ticket.resolved_date) : "-",
        สถานะ: statusLabel[ticket.status] || ticket.status,
      };
      const extraBase = {
        "วันที่แจ้ง": "",
        สาขา: "",
        ผู้แจ้ง: "",
        อุปกรณ์: "",
        อาการ: "",
        "วันที่ซ่อม": ticket.resolved_date ? formatDate(ticket.resolved_date) : "-",
        สถานะ: statusLabel[ticket.status] || ticket.status,
      };
      const notes = (ticket.logs || []).filter((l) => l.note?.trim());
      if (notes.length === 0) {
        data.push({ ...firstBase, แก้ไข: "", หมายเหตุ: "" });
      } else {
        notes.forEach((l, i) => {
          data.push({ ...(i === 0 ? firstBase : extraBase), แก้ไข: l.note!.trim(), หมายเหตุ: "" });
        });
      }
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Repairs");
    XLSX.writeFile(workbook, `repair-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">ไม่พบข้อมูลการซ่อม</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end gap-2 mb-4">
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
          <tr className="border-b border-gray-100 uppercase tracking-wider text-[11px] font-bold text-gray-400">
            <th className="text-left py-3 px-4 pb-4">วันที่แจ้ง</th>
            <th className="text-left py-3 px-4 pb-4">สาขา</th>
            <th className="text-left py-3 px-4 pb-4">ผู้แจ้ง</th>
            <th className="text-left py-3 px-4 pb-4">อุปกรณ์</th>
            <th className="text-left py-3 px-4 pb-4">อาการ</th>
            <th className="text-left py-3 px-4 pb-4">วันที่ซ่อม</th>
            <th className="text-left py-3 px-4 pb-4">สถานะ</th>
            <th className="text-left py-3 px-4 pb-4">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={`${row.ticket.ticket_id}-${idx}`}
              className={`border-b border-gray-50 transition-colors ${row.isFirst ? "hover:bg-[#F4F7FE]/50" : "hover:bg-[#F4F7FE]/30 bg-gray-50/20"}`}
            >
              <td className="py-4 px-4 text-gray-500 font-medium">
                {row.isFirst ? formatDate(row.ticket.report_date) : ""}
              </td>
              <td className="py-4 px-4 font-bold text-[#2B3674]">
                {row.isFirst ? (row.ticket.branch?.branch_name || "") : ""}
              </td>
              <td className="py-4 px-4 font-medium text-gray-500">
                {row.isFirst ? (row.ticket.reporter?.name || "-") : ""}
              </td>
              <td className="py-4 px-4 font-medium text-gray-600">
                {row.isFirst ? (row.ticket.category?.category_name || "") : ""}
              </td>
              <td className="py-4 px-4 max-w-xs truncate font-medium text-gray-500">
                {row.isFirst ? row.ticket.issue_description : ""}
              </td>
              <td className="py-4 px-4 text-gray-500 font-medium">
                {row.ticket.resolved_date ? formatDate(row.ticket.resolved_date) : "-"}
              </td>
              <td className="py-4 px-4">
                <span
                  className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${statusBadge[row.ticket.status] || ""}`}
                >
                  {statusLabel[row.ticket.status] || row.ticket.status}
                </span>
              </td>
              <td className="py-4 px-4">
                <Link
                  href={`/tickets/${row.ticket.ticket_id}`}
                  className="inline-flex items-center rounded-lg bg-[#F4F7FE] px-4 py-2 text-xs font-bold text-[#4318FF] hover:bg-gray-100 transition-colors"
                >
                  ดูรายละเอียด
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
