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
      isAdmin,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ข้อมูลการซ่อม</h1>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
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

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <RepairTable tickets={tickets} />
      </div>
    </div>
  );
}
