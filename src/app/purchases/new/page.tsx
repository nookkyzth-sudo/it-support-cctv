import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { PurchaseForm } from "@/components/ui/purchase-form";

export default async function NewPurchasePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const branches = await prisma.branches.findMany({
    orderBy: { branch_name: 'asc' }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#2B3674] tracking-tight">สร้างบันทึกแจ้งซื้อ</h1>
        <p className="text-sm font-medium text-gray-400 mt-1">กรอกข้อมูลการแจ้งซื้ออุปกรณ์ของสาขา</p>
      </div>
      <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
        <PurchaseForm branches={branches} />
      </div>
    </div>
  );
}
