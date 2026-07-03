"use client";

import { useActionState } from "react";
import { createTicket } from "@/app/actions/tickets";
import { useRouter } from "next/navigation";

export function ReportForm() {
  const router = useRouter();

  async function handleSubmit(
    prev: { error?: string; success?: boolean; ticket_id?: number } | null,
    formData: FormData
  ) {
    const result = await createTicket(prev, formData);
    if (result?.success && result?.ticket_id) {
      router.push(`/tickets/${result.ticket_id}`);
    }
    return result || null;
  }

  const [state, formAction, pending] = useActionState(handleSubmit, null);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          สาขา
        </label>
        <input
          name="branch_name"
          required
          placeholder="กรอกชื่อสาขา (เช่น NINE, AY, HIPB)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ประเภทอุปกรณ์
        </label>
        <input
          name="category_name"
          required
          placeholder="กรอกประเภทอุปกรณ์ (เช่น CCTV, PC/CPU, UPS)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ผู้รับผิดชอบ
        </label>
        <input
          name="technician_name"
          placeholder="ชื่อช่างผู้รับผิดชอบ"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          วันที่แจ้ง
        </label>
        <input
          name="report_date"
          placeholder="dd/mm/2569"
          defaultValue={(() => {
            const d = new Date();
            return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear() + 543}`;
          })()}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          รายละเอียดอาการเสีย
        </label>
        <textarea
          name="issue_description"
          required
          rows={4}
          placeholder="อธิบายอาการที่พบ..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
      </div>

      {state?.error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {pending ? "กำลังส่ง..." : "ส่งแจ้งซ่อม"}
      </button>
    </form>
  );
}
