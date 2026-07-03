"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function RepairDateFilter({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(dateFrom);
  const [to, setTo] = useState(dateTo);

  function applyFilter() {
    const params = new URLSearchParams(searchParams.toString());
    if (from) params.set("date_from", from);
    else params.delete("date_from");
    if (to) params.set("date_to", to);
    else params.delete("date_to");
    router.push(`/repairs?${params.toString()}`);
  }

  function clearFilter() {
    setFrom("");
    setTo("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date_from");
    params.delete("date_to");
    router.push(`/repairs?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">ตั้งแต่วันที่</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">ถึงวันที่</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        />
      </div>
      <button
        type="button"
        onClick={applyFilter}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        ค้นหา
      </button>
      {(dateFrom || dateTo) && (
        <button
          type="button"
          onClick={clearFilter}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          ล้าง
        </button>
      )}
    </div>
  );
}
