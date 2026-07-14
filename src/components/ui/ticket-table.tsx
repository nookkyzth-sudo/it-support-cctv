"use client";

import { useState, useMemo } from "react";
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

export function TicketTable({ tickets, userRole, currentUserId }: { tickets: Ticket[], userRole?: string, currentUserId?: string }) {
  const [branchFilter, setBranchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const uniqueBranches = useMemo(() => {
    const map = new Map();
    tickets.forEach(t => {
      if (t.branch) map.set(t.branch_id, t.branch);
    });
    return Array.from(map.values()).sort((a, b) => a.branch_name.localeCompare(b.branch_name));
  }, [tickets]);

  const uniqueCategories = useMemo(() => {
    const map = new Map();
    tickets.forEach(t => {
      if (t.category) map.set(t.category_id, t.category);
    });
    return Array.from(map.values()).sort((a, b) => a.category_name.localeCompare(b.category_name));
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (branchFilter && String(t.branch_id) !== branchFilter) return false;
      if (categoryFilter && String(t.category_id) !== categoryFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;

      if (dateFrom || dateTo) {
        // use report_date for date range filtering
        const tDate = new Date(t.report_date);
        tDate.setHours(0, 0, 0, 0);

        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (tDate < from) return false;
        }

        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (tDate > to) return false;
        }
      }

      return true;
    });
  }, [tickets, branchFilter, categoryFilter, statusFilter, dateFrom, dateTo]);

  const showUserCol = userRole === "technician" || userRole === "admin";

  const downloadCsv = () => {
    const headers = [
      "วันที่แจ้ง",
      "สาขา",
      ...(showUserCol ? ["ผู้แจ้ง"] : []),
      "อุปกรณ์",
      "อาการ",
      "วันที่ซ่อม",
      "สถานะ",
      "แก้ไข",
      "หมายเหตุ",
    ];

    const rows: string[][] = [];
    for (const ticket of filteredTickets) {
      const firstBase = [
        formatDate(ticket.report_date),
        ticket.branch?.branch_name || "",
        ...(showUserCol ? [ticket.reporter?.name || "-"] : []),
        ticket.category?.category_name || "",
        ticket.issue_description,
        ticket.resolved_date ? formatDate(ticket.resolved_date) : "-",
        statusLabel[ticket.status] || ticket.status,
      ];
      const extraBase = [
        "", 
        "", 
        ...(showUserCol ? [""] : []),
        "", 
        "",
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
    for (const ticket of filteredTickets) {
      const firstBase: Record<string, string> = {
        "วันที่แจ้ง": formatDate(ticket.report_date),
        สาขา: ticket.branch?.branch_name || "",
      };
      if (showUserCol) firstBase["ผู้แจ้ง"] = ticket.reporter?.name || "-";
      
      firstBase["อุปกรณ์"] = ticket.category?.category_name || "";
      firstBase["อาการ"] = ticket.issue_description;
      firstBase["วันที่ซ่อม"] = ticket.resolved_date ? formatDate(ticket.resolved_date) : "-";
      firstBase["สถานะ"] = statusLabel[ticket.status] || ticket.status;
      const extraBase: Record<string, string> = {
        "วันที่แจ้ง": "",
        สาขา: "",
      };
      if (showUserCol) extraBase["ผู้แจ้ง"] = "";

      extraBase["อุปกรณ์"] = "";
      extraBase["อาการ"] = "";
      extraBase["วันที่ซ่อม"] = ticket.resolved_date ? formatDate(ticket.resolved_date) : "-";
      extraBase["สถานะ"] = statusLabel[ticket.status] || ticket.status;
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
    <div className="space-y-4">
      {/* Filter and Export Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 mb-4">
        
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 flex-1">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">สาขา</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none"
            >
              <option value="">ทุกสาขา</option>
              {uniqueBranches.map((b) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">อุปกรณ์</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none"
            >
              <option value="">ทุกประเภท</option>
              {uniqueCategories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">สถานะ</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none"
            >
              <option value="">ทุกสถานะ</option>
              <option value="Pending">รอรับงาน</option>
              <option value="In_Progress">กำลังดำเนินการ</option>
              <option value="Claim">เคลม</option>
              <option value="Resolved">แก้ไขเรียบร้อย</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ตั้งแต่วันที่</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ถึงวันที่</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none"
            />
          </div>
          
          <button
            type="button"
            onClick={() => {
               // Filtering is already applied reactively, 
               // but we can keep a reset button or just let it act as a visual search button
               // In this case, "ค้นหา" can just be a dummy since state updates immediately.
            }}
            className="rounded-lg bg-[#4318FF] px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm h-[38px]"
          >
            ค้นหา
          </button>
        </div>

        {/* Exports */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadCsv}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 h-[38px] transition-colors"
          >
            ส่งออก CSV
          </button>
          <button
            type="button"
            onClick={downloadExcel}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 h-[38px] transition-colors shadow-sm"
          >
            ส่งออก Excel
          </button>
        </div>

      </div>

      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 text-gray-500 font-medium">
          ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 uppercase tracking-wider text-[11px] font-bold text-gray-400">
                <th className="text-left py-3 px-4 pb-4">สาขา</th>
                {showUserCol && <th className="text-left py-3 px-4 pb-4">ผู้แจ้ง</th>}
                <th className="text-left py-3 px-4 pb-4">อุปกรณ์</th>
                <th className="text-left py-3 px-4 pb-4">อาการ</th>
                <th className="text-left py-3 px-4 pb-4">วันที่ซ่อม</th>
                <th className="text-left py-3 px-4 pb-4">สถานะ</th>
                <th className="text-left py-3 px-4 pb-4">วันที่แจ้ง</th>
                <th className="text-left py-3 px-4 pb-4">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.ticket_id}
                  className="border-b border-gray-50 hover:bg-[#F4F7FE]/50 transition-colors"
                >
                  <td className="py-4 px-4 font-bold text-[#2B3674]">{ticket.branch?.branch_name}</td>
                  {showUserCol && <td className="py-4 px-4 font-medium text-gray-600">{ticket.reporter?.name || "-"}</td>}
                  <td className="py-4 px-4 font-medium text-gray-600">{ticket.category?.category_name}</td>
                  <td className="py-4 px-4 max-w-xs truncate text-gray-500 font-medium">
                    {ticket.issue_description}
                  </td>
                  <td className="py-4 px-4 text-gray-500 font-medium">
                    {ticket.resolved_date ? formatDate(ticket.resolved_date) : "-"}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${statusBadge[ticket.status] || ""}`}
                    >
                      {statusLabel[ticket.status] || ticket.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-500 font-medium">
                    {formatDate(ticket.report_date)}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {ticket.status === "Pending" ? (
                      <Link
                        href={`/tickets/${ticket.ticket_id}`}
                        className="inline-flex items-center rounded-lg bg-[#4318FF] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                      >
                        รับงาน
                      </Link>
                    ) : (
                      <Link
                        href={`/tickets/${ticket.ticket_id}`}
                        className="inline-flex items-center rounded-lg bg-[#F4F7FE] px-4 py-2 text-xs font-bold text-[#4318FF] hover:bg-gray-100 transition-colors"
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
      )}
    </div>
  );
}
