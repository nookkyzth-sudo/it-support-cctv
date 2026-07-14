"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteInstallationAttachment } from "@/app/actions/installation-attachments";

export function DeleteImageButton({ attachmentId }: { attachmentId: number }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("คุณต้องการลบรูปภาพนี้ใช่หรือไม่?")) return;
    setLoading(true);
    try {
      await deleteInstallationAttachment(attachmentId);
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการลบรูปภาพ หรือคุณไม่มีสิทธิ์ลบรูปภาพนี้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 shadow-md z-10"
      title="ลบรูปภาพ"
    >
      <Trash2 size={16} />
    </button>
  );
}
