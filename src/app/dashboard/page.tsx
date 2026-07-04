import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import {
  getBranches,
  getCategories,
  getCurrentUser,
  getKpis,
  getTickets,
} from "@/lib/supabase-db";
import { KpiWidget } from "@/components/ui/kpi-widget";
import { TicketFilters } from "@/components/ui/ticket-filters";
import { TicketTable } from "@/components/ui/ticket-table";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    branch_id?: string;
    category_id?: string;
    status?: string;
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

  const [branches, categories, kpis, tickets] = await Promise.all([
    getBranches(),
    getCategories(),
    getKpis({ userBranchId, viewerUserId: user.id, isAdmin }),
    getTickets({
      ...params,
      userBranchId,
      viewerUserId: user.id,
      isAdmin,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-500">
          สวัสดี, {dbUser?.name || user.email}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiWidget title="รอรับงาน" count={kpis.pending} color="red" />
        <KpiWidget title="กำลังดำเนินการ" count={kpis.inProgress} color="yellow" />
        <KpiWidget title="เสร็จแล้ว" count={kpis.resolved} color="green" />
      </div>

      <TicketFilters branches={branches} categories={categories} />
      <TicketTable tickets={tickets} />
    </div>
  );
}
