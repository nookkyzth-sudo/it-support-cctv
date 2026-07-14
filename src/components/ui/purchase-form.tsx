"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function PurchaseForm({ 
  branches, 
  initialData = null 
}: { 
  branches?: any[], 
  initialData?: any 
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    branch_name: initialData?.branch?.branch_name || "",
    request_date: initialData?.request_date 
      ? new Date(initialData.request_date).toISOString().split('T')[0]
      : "",
    items_details: initialData?.items_details || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create or Update purchase record
      const url = initialData 
        ? `/api/purchases/${initialData.id}` 
        : "/api/purchases";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error("Failed to save purchase");
      }

      const savedPurchase = await res.json();
      const purchaseId = initialData ? initialData.id : savedPurchase.id;

      // 2. Upload file if selected
      if (file) {
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("purchase_id", purchaseId.toString());

        const uploadRes = await fetch("/api/upload-purchase", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          alert(`บันทึกข้อมูลสำเร็จ แต่เกิดข้อผิดพลาดในการอัปโหลดไฟล์ใบเสร็จ: ${errText}`);
        }
      }

      router.push(initialData ? `/purchases/${purchaseId}` : "/purchases");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 space-y-4 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันที่แจ้งซื้อ</label>
          <input 
            type="date" 
            className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white transition-colors"
            value={formData.request_date}
            onChange={e => setFormData({ ...formData, request_date: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">เว้นว่างไว้หากต้องการใช้วันที่ปัจจุบัน</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">สาขาที่แจ้ง *</label>
          <input 
            required
            type="text"
            placeholder="กรอกชื่อสาขา (เช่น ZBY, NINE)"
            className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white transition-colors"
            value={formData.branch_name}
            onChange={e => setFormData({ ...formData, branch_name: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ข้อมูลทั้งหมด (วางข้อมูลการแจ้งซื้อที่นี่) *</label>
        <textarea 
          required 
          rows={10}
          placeholder="วางข้อความที่ก็อปปี้มาทั้งหมดที่นี่..."
          className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white transition-colors"
          value={formData.items_details}
          onChange={e => setFormData({ ...formData, items_details: e.target.value })}
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">แนบรูปใบเสร็จ (ถ้ามี)</label>
        <input 
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white transition-colors text-sm"
        />
        {initialData?.attachments?.length > 0 && (
          <p className="text-xs text-green-600 mt-1">
            (รายการนี้มีไฟล์แนบอยู่แล้ว {initialData.attachments.length} ไฟล์ หากแนบใหม่จะเพิ่มเข้าไปอีก)
          </p>
        )}
      </div>
      
      <div className="pt-6 flex gap-3">
        <button 
          type="button"
          onClick={() => router.back()}
          className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          ยกเลิก
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "กำลังบันทึก..." : (initialData ? "บันทึกการแก้ไข" : "บันทึกข้อมูล")}
        </button>
      </div>
    </form>
  );
}
