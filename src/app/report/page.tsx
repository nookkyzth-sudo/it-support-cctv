import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ReportForm } from "@/components/ui/report-form";

export default async function ReportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#2B3674] tracking-tight">แจ้งซ่อม</h1>
        <p className="text-sm font-medium text-gray-400 mt-1">กรอกข้อมูลเพื่อแจ้งปัญหาการใช้งานอุปกรณ์</p>
      </div>
      
      <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
        <ReportForm />
      </div>
    </div>
  );
}
