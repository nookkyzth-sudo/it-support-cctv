import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Search } from "lucide-react";

export default async function TeamPage() {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) redirect("/login");

  const supabase = await createAdminClient();
  const { data: me } = await supabase
    .from("users")
    .select("role, branch_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!me || (me.role !== "admin" && me.role !== "technician")) {
    redirect("/dashboard");
  }

  let whereClause: any = {
    role: { not: "admin" }
  };
  
  // Technician and Admin see all non-admin users

  // Fetch users and their branches (exclude admin)
  const users = await prisma.users.findMany({
    where: whereClause,
    include: { branch: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#2B3674] tracking-tight">ข้อมูลบุคลากร</h1>
        <p className="text-sm font-medium text-gray-400 mt-1">ดูรายชื่อและตรวจสอบข้อมูลการทำงานของทีมงาน</p>
      </div>

      <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <h2 className="text-lg font-bold text-[#2B3674]">รายชื่อพนักงานทั้งหมด ({users.length})</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 uppercase tracking-wider text-[11px] font-bold text-gray-400">
                <th className="px-4 py-3 pb-4 whitespace-nowrap">ชื่อพนักงาน</th>
                <th className="px-4 py-3 pb-4 whitespace-nowrap">อีเมล</th>
                <th className="px-4 py-3 pb-4 whitespace-nowrap">ตำแหน่ง (Role)</th>
                <th className="px-4 py-3 pb-4 whitespace-nowrap">สาขาที่สังกัด</th>
                <th className="px-4 py-3 pb-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className="border-b border-gray-50 hover:bg-[#F4F7FE]/50 align-middle transition-colors">
                  <td className="px-4 py-4 font-bold text-[#2B3674] whitespace-nowrap">
                    {u.name}
                  </td>
                  <td className="px-4 py-4 text-gray-500 whitespace-nowrap">
                    {u.email || "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                      u.role === 'admin' ? 'bg-red-50 text-red-600' :
                      u.role === 'technician' ? 'bg-green-50 text-green-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-600 font-medium whitespace-nowrap">
                    {u.branch?.branch_name || "ไม่ระบุ"}
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <Link
                      href={`/team/${u.user_id}`}
                      className="inline-flex items-center rounded-lg bg-[#F4F7FE] px-4 py-2 text-xs font-bold text-[#4318FF] hover:bg-blue-50 transition-colors"
                    >
                      ดูประวัติการทำงาน
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
