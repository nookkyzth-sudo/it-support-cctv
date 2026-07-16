"use client";

import { useState } from "react";
import { Trash2, Download } from "lucide-react";

export function ImageActions({ 
  attachmentId, 
  filePath, 
  onDelete 
}: { 
  attachmentId: number; 
  filePath: string; 
  onDelete: (id: number) => Promise<{ success: boolean } | void>; 
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("คุณต้องการลบรูปภาพนี้ใช่หรือไม่?")) return;
    setLoading(true);
    try {
      await onDelete(attachmentId);
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการลบรูปภาพ หรือคุณไม่มีสิทธิ์ลบรูปภาพนี้");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(filePath);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const parts = filePath.split('/');
      const filename = parts[parts.length - 1] || `image-${attachmentId}.jpg`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // fallback
      window.open(filePath, '_blank');
    }
  };

  return (
    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <button
        type="button"
        onClick={handleDownload}
        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg shadow-md flex items-center justify-center"
        title="ดาวน์โหลดรูปภาพ"
      >
        <Download size={16} />
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg disabled:opacity-50 shadow-md flex items-center justify-center"
        title="ลบรูปภาพ"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
