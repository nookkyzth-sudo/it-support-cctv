import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import {
  getBranches,
  getCategories,
  getCurrentUser,
  getTickets,
} from "@/lib/supabase-db";
import { TicketFilters } from "@/components/ui/ticket-filters";
import { RepairTable } from "@/components/ui/repair-table";
import { RepairDateFilter } from "@/components/ui/repair-date-filter";

export default async function RepairsPage({
  searchParams,
}: {
  searchParams: Promise<{
    branch_id?: string;
    category_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const dbUser = await getCurrentUser();
  const isAdmin = dbUser?.role === "admin";
  const userBranchId = dbUser?.role === "staff" ? dbUser.branch_id : null;

  const [branches, categories, tickets] = await Promise.all([
    getBranches(),
    getCategories(),
    getTickets({
      ...params,
      userBranchId,
      includeLogs: true,
      viewerUserId: user.id,
      userRole: dbUser?.role,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#2B3674] tracking-tight">ข้อมูลการซ่อม</h1>
        <p className="text-sm font-medium text-gray-400 mt-1">ประวัติการซ่อมบำรุงทั้งหมด</p>
      </div>

      <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
        <div className="flex flex-wrap gap-3 items-end mb-6">
          <TicketFilters
            branches={branches}
            categories={categories}
            basePath="/repairs"
          />
          <RepairDateFilter
            dateFrom={params.date_from || ""}
            dateTo={params.date_to || ""}
          />
        </div>
        <RepairTable tickets={tickets} />
      </div>
    </div>
  );
}
