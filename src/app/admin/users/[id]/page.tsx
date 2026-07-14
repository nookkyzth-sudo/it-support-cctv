import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TicketTable } from "@/components/ui/ticket-table";
import { PurchaseTable } from "@/components/ui/purchase-table";
import { InstallationTable } from "@/components/ui/installation-table";
import { ArrowLeft, User, Wrench, ShoppingCart, HardDrive, CheckCircle2, PlusCircle } from "lucide-react";

export default async function AdminUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await createClient();
  const { data: { user: currentUser } } = await auth.auth.getUser();

  if (!currentUser) redirect("/login");

  const supabase = await createAdminClient();
  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (!me || me.role !== "admin") {
    redirect("/dashboard");
  }

  const userId = (await params).id;

  const userProfile = await prisma.users.findUnique({
    where: { user_id: userId },
    include: { branch: true }
  });

  if (!userProfile) {
    redirect("/admin");
  }

  // Fetch all related data
  const [reportedTickets, techTickets, purchaseRequests, installations] = await Promise.all([
    prisma.tickets.findMany({
      where: { reporter_id: userId },
      include: { branch: true, category: true, reporter: true, technician: true },
      orderBy: { report_date: 'desc' }
    }),
    prisma.tickets.findMany({
      where: { technician_id: userId },
      include: { branch: true, category: true, reporter: true, technician: true },
      orderBy: { report_date: 'desc' }
    }),
    prisma.purchase_requests.findMany({
      where: { requester_id: userId },
      include: { branch: true, requester: true },
      orderBy: { request_date: 'desc' }
    }),
    prisma.equipment_replacements.findMany({
      where: { recorded_by: userId },
      include: { branch: true, recorder: true },
      orderBy: { action_date: 'desc' }
    })
  ]);

  // Statistics
  const totalReported = reportedTickets.length;
  const totalResolvedTech = techTickets.filter(t => t.status === "Resolved").length;
  const totalPurchases = purchaseRequests.length;
  const totalInstallations = installations.length;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-[28px] font-extrabold text-[#2B3674] tracking-tight">ข้อมูลผู้ใช้: {userProfile.name}</h1>
          <p className="text-sm font-medium text-gray-400 mt-1">
            อีเมล: {userProfile.email || "-"} | สิทธิ์: <span className="uppercase text-blue-600">{userProfile.role}</span> | สาขา: {userProfile.branch?.branch_name || "ไม่ระบุ"}
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[20px] p-5 shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <PlusCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">แจ้งซ่อมทั้งหมด</p>
            <h3 className="text-2xl font-bold text-[#2B3674]">{totalReported}</h3>
          </div>
        </div>

        {userProfile.role === "technician" || userProfile.role === "admin" ? (
          <div className="bg-white rounded-[20px] p-5 shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">ปิดงานซ่อมแล้ว</p>
              <h3 className="text-2xl font-bold text-[#2B3674]">{totalResolvedTech} <span className="text-sm text-gray-400 font-normal">/ {techTickets.length}</span></h3>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[20px] p-5 shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4 opacity-50">
             <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center">
              <Wrench size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">รับงานซ่อม</p>
              <h3 className="text-2xl font-bold text-gray-400">-</h3>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[20px] p-5 shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">จดบันทึกแจ้งซื้อ</p>
            <h3 className="text-2xl font-bold text-[#2B3674]">{totalPurchases}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-5 shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
            <HardDrive size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">บันทึกติดตั้งอุปกรณ์</p>
            <h3 className="text-2xl font-bold text-[#2B3674]">{totalInstallations}</h3>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        
        {reportedTickets.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-[#2B3674] mb-4 flex items-center gap-2">
              <Wrench size={20} className="text-blue-600" /> ประวัติการแจ้งซ่อม (Reported)
            </h2>
            <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
              <TicketTable tickets={reportedTickets} userRole={userProfile.role} currentUserId={userProfile.user_id} />
            </div>
          </section>
        )}

        {techTickets.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-[#2B3674] mb-4 flex items-center gap-2">
              <Wrench size={20} className="text-green-600" /> ประวัติการรับงานซ่อม (Assigned Technician)
            </h2>
            <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
              <TicketTable tickets={techTickets} userRole={userProfile.role} currentUserId={userProfile.user_id} />
            </div>
          </section>
        )}

        {purchaseRequests.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-[#2B3674] mb-4 flex items-center gap-2">
              <ShoppingCart size={20} className="text-orange-500" /> ประวัติจดบันทึกแจ้งซื้อ
            </h2>
            <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
              <PurchaseTable initialData={purchaseRequests} isAdmin={true} />
            </div>
          </section>
        )}

        {installations.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-[#2B3674] mb-4 flex items-center gap-2">
              <HardDrive size={20} className="text-purple-600" /> ประวัติบันทึกติดตั้ง/เปลี่ยนอุปกรณ์
            </h2>
            <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
              <InstallationTable initialData={installations} isAdmin={true} />
            </div>
          </section>
        )}

        {reportedTickets.length === 0 && techTickets.length === 0 && purchaseRequests.length === 0 && installations.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-[20px] shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
            ผู้ใช้นี้ยังไม่มีประวัติการทำรายการใดๆ ในระบบ
          </div>
        )}

      </div>
    </div>
  );
}
