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
    getKpis({ userBranchId, viewerUserId: user.id, userRole: dbUser?.role }),
    getTickets({
      ...params,
      userBranchId,
      viewerUserId: user.id,
      userRole: dbUser?.role,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#2B3674] tracking-tight">Dashboard</h1>
        <p className="text-sm font-medium text-gray-400 mt-1">
          สวัสดี, {dbUser?.name || user.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiWidget title="รอรับงาน" count={kpis.pending} color="red" />
        <KpiWidget title="กำลังดำเนินการ" count={kpis.inProgress} color="yellow" />
        <KpiWidget title="แก้ไขเรียบร้อย" count={kpis.resolved} color="green" />
      </div>

      <div className="bg-white rounded-[20px] shadow-[0_18px_40px_rgba(112,144,176,0.12)] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2B3674]">รายการแจ้งซ่อม</h2>
        </div>
        <TicketFilters branches={branches} categories={categories} />
        <div className="mt-6">
          <TicketTable tickets={tickets} />
        </div>
      </div>
    </div>
  );
}
