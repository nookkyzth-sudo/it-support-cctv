import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PurchaseTable } from "@/components/ui/purchase-table";

export default async function PurchasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.users.findUnique({ where: { user_id: user.id } });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = {};
  if (dbUser?.role === "staff") {
    // Staff sees only their own requests
    whereClause.requester_id = user.id;
  }
  // Technician and Admin see all requests

  const purchases = await prisma.purchase_requests.findMany({
    where: whereClause,
    include: { branch: true, requester: true },
    orderBy: { request_date: 'desc' }
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#2B3674] tracking-tight">รายการจดบันทึกแจ้งซื้อ</h1>
          <p className="text-sm font-medium text-gray-400 mt-1">จัดการและติดตามรายการสั่งซื้ออุปกรณ์</p>
        </div>
        <Link 
          href="/purchases/new"
          className="bg-[#4318FF] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-[0_10px_20px_rgba(67,24,255,0.2)]"
        >
          + สร้างบันทึกแจ้งซื้อ
        </Link>
      </div>

      <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
        <PurchaseTable initialData={purchases} isAdmin={dbUser?.role !== "staff"} />
      </div>
    </div>
  );
}
