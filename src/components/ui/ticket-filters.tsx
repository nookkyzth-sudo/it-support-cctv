"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Branch, Category } from "@/types";

export function TicketFilters({
  branches,
  categories,
  basePath = "/dashboard",
}: {
  branches: Branch[];
  categories: Category[];
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        defaultValue={searchParams.get("branch_id") || ""}
        onChange={(e) => updateFilter("branch_id", e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
      >
        <option value="">ทุกสาขา</option>
        {branches.map((b) => (
          <option key={b.branch_id} value={b.branch_id}>
            {b.branch_name}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("category_id") || ""}
        onChange={(e) => updateFilter("category_id", e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
      >
        <option value="">ทุกประเภท</option>
        {categories.map((c) => (
          <option key={c.category_id} value={c.category_id}>
            {c.category_name}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("status") || ""}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
      >
        <option value="">ทุกสถานะ</option>
        <option value="Pending">รอรับงาน</option>
        <option value="In_Progress">กำลังดำเนินการ</option>
        <option value="Claim">เคลม</option>
        <option value="Resolved">เสร็จสิ้น</option>
      </select>

    </div>
  );
}
