"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function InstallationTable({ initialData, isAdmin }: { initialData: any[], isAdmin: boolean }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const uniqueBranches = useMemo(() => {
    const branches = new Set<string>();
    initialData.forEach((item) => {
      const bName = item.target_branch || item.branch?.branch_name;
      if (bName) branches.add(bName);
    });
    return Array.from(branches).sort();
  }, [initialData]);

  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
      const bName = item.target_branch || item.branch?.branch_name;

      // Search text
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        const matchesText =
          bName?.toLowerCase().includes(lower) ||
          item.recorder?.name?.toLowerCase().includes(lower) ||
          item.equipment_details?.toLowerCase().includes(lower);
        if (!matchesText) return false;
      }

      // Branch filter
      if (branchFilter && bName !== branchFilter) return false;

      // Date filter
      if (dateFrom || dateTo) {
        const iDate = new Date(item.action_date);
        iDate.setHours(0, 0, 0, 0);

        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (iDate < from) return false;
        }

        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (iDate > to) return false;
        }
      }

      return true;
    });
  }, [initialData, searchTerm, branchFilter, dateFrom, dateTo]);

  const downloadCsv = () => {
    const headers = ["วันที่", "สาขา", "ผู้บันทึก", "ข้อมูลอุปกรณ์"];
    const rows = filteredData.map(item => [
      formatDate(item.action_date),
      item.target_branch || item.branch?.branch_name || "",
      item.recorder?.name || "-",
      item.equipment_details || ""
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `installation-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async () => {
    const XLSX = await import("xlsx");
    const data = filteredData.map(item => ({
      "วันที่": formatDate(item.action_date),
      "สาขา": item.target_branch || item.branch?.branch_name || "",
      "ผู้บันทึก": item.recorder?.name || "-",
      "ข้อมูลอุปกรณ์": item.equipment_details || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Installations");
    XLSX.writeFile(workbook, `installation-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณต้องการลบบันทึกนี้ใช่หรือไม่?")) return;
    
    setLoadingId(id);
    try {
      const res = await fetch(`/api/installations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoadingId(null);
    }
  };

  if (initialData.length === 0) {
    return <div className="text-center py-8 text-gray-500 font-medium">ยังไม่มีข้อมูลการจดบันทึกติดตั้ง/เปลี่ยนอุปกรณ์</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter and Export Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 mb-4">
        
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 flex-1">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ค้นหา</label>
            <input
              type="text"
              placeholder="ข้อมูลอุปกรณ์, ผู้บันทึก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none w-48"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">สาขา</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#4318FF] focus:border-transparent outline-none"
            >
              <option value="">ทุกสาขา</option>
              {uniqueBranches.map((bName) => (
                <option key={bName} value={bName}>{bName}</option>
              ))}
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
            onClick={() => {}}
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
            className="rounded-lg bg-[#4318FF] px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 h-[38px] transition-colors"
          >
            ส่งออก Excel
          </button>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลที่ค้นหา</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 uppercase tracking-wider text-[11px] font-bold text-gray-400">
                <th className="px-4 py-3 pb-4 whitespace-nowrap">วันที่</th>
                <th className="px-4 py-3 pb-4 whitespace-nowrap">สาขา (ผู้บันทึก)</th>
                <th className="px-4 py-3 pb-4">ข้อมูลอุปกรณ์</th>
                <th className="px-4 py-3 pb-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                 <tr key={item.id} className="border-b border-gray-50 hover:bg-[#F4F7FE]/50 align-top transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-gray-500 font-medium">
                    {formatDate(item.action_date)}
                  </td>
                  <td className="px-4 py-4 font-bold text-[#2B3674] whitespace-nowrap">
                    {item.target_branch || item.branch?.branch_name}
                    <div className="text-xs text-gray-400 font-medium mt-0.5">{item.recorder?.name}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="whitespace-pre-wrap text-gray-600 max-w-3xl font-medium">
                      {item.equipment_details}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => router.push(`/installations/${item.id}`)}
                        className="inline-flex items-center rounded-lg bg-[#F4F7FE] px-3 py-1.5 text-xs font-bold text-[#4318FF] hover:bg-gray-100 transition-colors"
                      >
                        ดู/แก้ไข
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={loadingId === item.id}
                          className="inline-flex items-center rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          {loadingId === item.id ? "กำลังลบ..." : "ลบ"}
                        </button>
                      )}
                    </div>
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
