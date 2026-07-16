import React from "react";

export default function OpenPortPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full bg-white rounded-[20px] shadow-[0_18px_40px_rgba(112,144,176,0.12)] overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#2B3674]">เครื่องมือตรวจสอบพอร์ต (Open Port)</h2>
          <p className="text-sm text-gray-500 mt-1">
            เช็คสถานะ Port ว่าเปิดใช้งานหรือไม่
          </p>
        </div>
      </div>
      <div className="flex-1 w-full bg-gray-50/30 relative">
        <iframe
          src="https://open-port.vercel.app/"
          className="absolute inset-0 w-full h-full border-0"
          title="Open Port Web"
          allow="clipboard-write; clipboard-read"
        />
      </div>
    </div>
  );
}
