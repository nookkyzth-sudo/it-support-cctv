import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { InstallationTable } from "@/components/ui/installation-table";

export default async function InstallationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.users.findUnique({ where: { user_id: user.id } });
  
  let whereClause: any = {};
  if (dbUser?.role === "staff") {
    // Staff sees only their own requests
    whereClause.recorded_by = user.id;
  }
  // Technician and Admin see all requests

  const installations = await prisma.equipment_replacements.findMany({
    where: whereClause,
    include: { branch: true, recorder: true },
    orderBy: { action_date: 'desc' }
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#2B3674] tracking-tight">บันทึกการติดตั้ง/เปลี่ยนอุปกรณ์</h1>
          <p className="text-sm font-medium text-gray-400 mt-1">จัดการและติดตามประวัติการติดตั้งอุปกรณ์ตามสาขา</p>
        </div>
        <Link 
          href="/installations/new"
          className="bg-[#4318FF] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-[0_10px_20px_rgba(67,24,255,0.2)]"
        >
          + สร้างบันทึกใหม่
        </Link>
      </div>

      <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
        <InstallationTable initialData={installations} isAdmin={dbUser?.role !== "staff"} />
      </div>
    </div>
  );
}
