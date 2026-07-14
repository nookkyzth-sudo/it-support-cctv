"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function InstallationForm({ 
  initialData = null 
}: { 
  initialData?: any 
}) {
  const router = useRouter();
  const equipmentInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [equipmentFiles, setEquipmentFiles] = useState<FileList | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    target_branch: initialData?.target_branch || initialData?.branch?.branch_name || "",
    action_date: initialData?.action_date 
      ? new Date(initialData.action_date).toISOString().split('T')[0]
      : "",
    equipment_details: initialData?.equipment_details || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData 
        ? `/api/installations/${initialData.id}` 
        : "/api/installations";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error("Failed to save installation record");
      }

      const savedInstallation = await res.json();
      const installationId = initialData ? initialData.id : savedInstallation.id;

      // Upload Equipment Images
      if (equipmentFiles && equipmentFiles.length > 0) {
        for (let i = 0; i < equipmentFiles.length; i++) {
          const file = equipmentFiles[i];
          const uploadData = new FormData();
          uploadData.append("file", file);
          uploadData.append("installation_id", installationId.toString());
          uploadData.append("type", "equipment");

          await fetch("/api/upload-installation", {
            method: "POST",
            body: uploadData,
          });
        }
      }

      // Upload Receipt Image
      if (receiptFile) {
        const uploadData = new FormData();
        uploadData.append("file", receiptFile);
        uploadData.append("installation_id", installationId.toString());
        uploadData.append("type", "receipt");

        await fetch("/api/upload-installation", {
          method: "POST",
          body: uploadData,
        });
      }

      router.push(initialData ? `/installations/${installationId}` : "/installations");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-[#2B3674] mb-2">วันที่ติดตั้ง/เปลี่ยน *</label>
          <input 
            type="date" 
            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#4318FF] focus:border-transparent transition-all outline-none"
            value={formData.action_date}
            onChange={e => setFormData({ ...formData, action_date: e.target.value })}
            required
          />
          <p className="text-xs text-gray-400 font-medium mt-1.5">เว้นว่างไว้หากต้องการใช้วันที่ปัจจุบัน</p>
        </div>
        <div>
          <label className="block text-sm font-bold text-[#2B3674] mb-2">สาขา *</label>
          <input 
            required
            type="text"
            placeholder="กรอกชื่อสาขา (เช่น ZBY, NINE)"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#4318FF] focus:border-transparent transition-all outline-none"
            value={formData.target_branch}
            onChange={e => setFormData({ ...formData, target_branch: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-[#2B3674] mb-2">ข้อมูลอุปกรณ์ *</label>
        <textarea 
          required 
          rows={6}
          placeholder="กรอกข้อมูลอุปกรณ์ที่นำไปติดตั้งหรือเปลี่ยน..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#4318FF] focus:border-transparent transition-all outline-none resize-none"
          value={formData.equipment_details}
          onChange={e => setFormData({ ...formData, equipment_details: e.target.value })}
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="bg-[#F4F7FE]/50 p-4 rounded-xl border border-blue-50">
          <label className="block text-sm font-bold text-[#2B3674] mb-2">แนบรูปอุปกรณ์ (เลือกได้หลายรูป)</label>
          <input 
            type="file"
            accept="image/*"
            multiple
            ref={equipmentInputRef}
            onChange={e => setEquipmentFiles(e.target.files)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#4318FF] file:text-white hover:file:bg-blue-700 transition-all cursor-pointer"
          />
        </div>
        <div className="bg-[#F4F7FE]/50 p-4 rounded-xl border border-blue-50">
          <label className="block text-sm font-bold text-[#2B3674] mb-2">แนบรูปใบเสร็จ (ถ้ามี)</label>
          <input 
            type="file"
            accept="image/*"
            ref={receiptInputRef}
            onChange={e => setReceiptFile(e.target.files?.[0] || null)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#4318FF] file:text-white hover:file:bg-blue-700 transition-all cursor-pointer"
          />
        </div>
      </div>
      
      <div className="pt-8 flex gap-4">
        <button 
          type="button"
          onClick={() => router.back()}
          className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          ยกเลิก
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="flex-1 bg-[#4318FF] text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-[0_10px_20px_rgba(67,24,255,0.2)]"
        >
          {loading ? "กำลังบันทึก..." : (initialData ? "บันทึกการแก้ไข" : "บันทึกข้อมูล")}
        </button>
      </div>
    </form>
  );
}
