"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InstallationTable({ initialData, isAdmin }: { initialData: any[], isAdmin: boolean }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);

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
          {initialData.map((item) => (
             <tr key={item.id} className="border-b border-gray-50 hover:bg-[#F4F7FE]/50 align-top transition-colors">
              <td className="px-4 py-4 whitespace-nowrap text-gray-500 font-medium">
                {new Date(item.action_date).toLocaleDateString('th-TH')}
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
  );
}
