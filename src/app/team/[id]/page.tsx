import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TicketTable } from "@/components/ui/ticket-table";
import { PurchaseTable } from "@/components/ui/purchase-table";
import { InstallationTable } from "@/components/ui/installation-table";
import { ArrowLeft, User, Wrench, ShoppingCart, HardDrive, CheckCircle2, PlusCircle } from "lucide-react";

export default async function TeamUserProfilePage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const auth = await createClient();
  const { data: { user: currentUser } } = await auth.auth.getUser();

  if (!currentUser) redirect("/login");

  const supabase = await createAdminClient();
  const { data: me } = await supabase
    .from("users")
    .select("role, branch_id")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (!me || (me.role !== "admin" && me.role !== "technician")) {
    redirect("/dashboard");
  }

  const userId = (await params).id;
  const currentTab = (await searchParams).tab || "reported";

  const userProfile = await prisma.users.findUnique({
    where: { user_id: userId },
    include: { branch: true }
  });

  if (!userProfile) {
    redirect("/team");
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

  // Helper to format dates to string for TicketTable
  const formatTicketDates = (t: any) => ({
    ...t,
    report_date: t.report_date ? t.report_date.toISOString() : null,
    repair_date: t.repair_date ? t.repair_date.toISOString() : null,
    completion_date: t.completion_date ? t.completion_date.toISOString() : null,
    updated_at: t.updated_at ? t.updated_at.toISOString() : null,
  });

  const formattedReportedTickets = reportedTickets.map(formatTicketDates) as any;
  const formattedTechTickets = techTickets.map(formatTicketDates) as any;

  // Statistics
  const totalReported = reportedTickets.length;
  const totalResolvedTech = techTickets.filter(t => t.status === "Resolved").length;
  const totalPurchases = purchaseRequests.length;
  const totalInstallations = installations.length;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/team" className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-[28px] font-extrabold text-[#2B3674] tracking-tight">ข้อมูลพนักงาน: {userProfile.name}</h1>
          <p className="text-sm font-medium text-gray-400 mt-1">
            อีเมล: {userProfile.email || "-"} | สิทธิ์: <span className="uppercase text-blue-600">{userProfile.role}</span> | สาขา: {userProfile.branch?.branch_name || "ไม่ระบุ"}
          </p>
        </div>
      </div>

      {/* KPI Stats (Clickable Tabs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="?tab=reported">
          <div className={`rounded-[20px] p-5 shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4 transition-all hover:scale-[1.02] cursor-pointer ${currentTab === "reported" ? "bg-[#4318FF] text-white" : "bg-white"}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentTab === "reported" ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"}`}>
              <PlusCircle size={24} />
            </div>
            <div>
              <p className={`text-sm font-medium ${currentTab === "reported" ? "text-white/80" : "text-gray-500"}`}>แจ้งซ่อมทั้งหมด</p>
              <h3 className={`text-2xl font-bold ${currentTab === "reported" ? "text-white" : "text-[#2B3674]"}`}>{totalReported}</h3>
            </div>
          </div>
        </Link>

        {userProfile.role === "technician" || userProfile.role === "admin" ? (
          <Link href="?tab=tech">
            <div className={`rounded-[20px] p-5 shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4 transition-all hover:scale-[1.02] cursor-pointer ${currentTab === "tech" ? "bg-[#05CD99] text-white" : "bg-white"}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentTab === "tech" ? "bg-white/20 text-white" : "bg-green-50 text-green-600"}`}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className={`text-sm font-medium ${currentTab === "tech" ? "text-white/80" : "text-gray-500"}`}>รับงานซ่อม</p>
                <h3 className={`text-2xl font-bold ${currentTab === "tech" ? "text-white" : "text-[#2B3674]"}`}>{totalResolvedTech} <span className={`text-sm font-normal ${currentTab === "tech" ? "text-white/80" : "text-gray-400"}`}>/ {techTickets.length}</span></h3>
              </div>
            </div>
          </Link>
        ) : (
          <div className="bg-white rounded-[20px] p-5 shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4 opacity-50 cursor-not-allowed">
             <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center">
              <Wrench size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">รับงานซ่อม</p>
              <h3 className="text-2xl font-bold text-gray-400">-</h3>
            </div>
          </div>
        )}

        <Link href="?tab=purchases">
          <div className={`rounded-[20px] p-5 shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4 transition-all hover:scale-[1.02] cursor-pointer ${currentTab === "purchases" ? "bg-[#FFCE20] text-white" : "bg-white"}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentTab === "purchases" ? "bg-white/20 text-white" : "bg-orange-50 text-orange-500"}`}>
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className={`text-sm font-medium ${currentTab === "purchases" ? "text-white/90" : "text-gray-500"}`}>จดบันทึกแจ้งซื้อ</p>
              <h3 className={`text-2xl font-bold ${currentTab === "purchases" ? "text-white" : "text-[#2B3674]"}`}>{totalPurchases}</h3>
            </div>
          </div>
        </Link>

        <Link href="?tab=installations">
          <div className={`rounded-[20px] p-5 shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4 transition-all hover:scale-[1.02] cursor-pointer ${currentTab === "installations" ? "bg-[#7000FF] text-white" : "bg-white"}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentTab === "installations" ? "bg-white/20 text-white" : "bg-purple-50 text-purple-600"}`}>
              <HardDrive size={24} />
            </div>
            <div>
              <p className={`text-sm font-medium ${currentTab === "installations" ? "text-white/80" : "text-gray-500"}`}>บันทึกติดตั้งอุปกรณ์</p>
              <h3 className={`text-2xl font-bold ${currentTab === "installations" ? "text-white" : "text-[#2B3674]"}`}>{totalInstallations}</h3>
            </div>
          </div>
        </Link>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        
        {currentTab === "reported" && (
          <section>
            <h2 className="text-lg font-bold text-[#2B3674] mb-4 flex items-center gap-2">
              <PlusCircle size={20} className="text-[#4318FF]" /> ประวัติการแจ้งซ่อม (Reported)
            </h2>
            {reportedTickets.length > 0 ? (
              <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
                <TicketTable tickets={formattedReportedTickets} userRole={userProfile.role} currentUserId={userProfile.user_id} />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 bg-white rounded-[20px] shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
                ไม่มีประวัติการแจ้งซ่อม
              </div>
            )}
          </section>
        )}

        {currentTab === "tech" && (userProfile.role === "technician" || userProfile.role === "admin") && (
          <section>
            <h2 className="text-lg font-bold text-[#2B3674] mb-4 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-[#05CD99]" /> ประวัติการรับงานซ่อม (Assigned Technician)
            </h2>
            {techTickets.length > 0 ? (
              <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
                <TicketTable tickets={formattedTechTickets} userRole={userProfile.role} currentUserId={userProfile.user_id} />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 bg-white rounded-[20px] shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
                ไม่มีประวัติการรับงานซ่อม
              </div>
            )}
          </section>
        )}

        {currentTab === "purchases" && (
          <section>
            <h2 className="text-lg font-bold text-[#2B3674] mb-4 flex items-center gap-2">
              <ShoppingCart size={20} className="text-[#FFCE20]" /> ประวัติจดบันทึกแจ้งซื้อ
            </h2>
            {purchaseRequests.length > 0 ? (
              <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
                <PurchaseTable initialData={purchaseRequests} isAdmin={true} />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 bg-white rounded-[20px] shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
                ไม่มีประวัติจดบันทึกแจ้งซื้อ
              </div>
            )}
          </section>
        )}

        {currentTab === "installations" && (
          <section>
            <h2 className="text-lg font-bold text-[#2B3674] mb-4 flex items-center gap-2">
              <HardDrive size={20} className="text-[#7000FF]" /> ประวัติบันทึกติดตั้ง/เปลี่ยนอุปกรณ์
            </h2>
            {installations.length > 0 ? (
              <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
                <InstallationTable initialData={installations} isAdmin={true} />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 bg-white rounded-[20px] shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
                ไม่มีประวัติบันทึกติดตั้ง/เปลี่ยนอุปกรณ์
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
