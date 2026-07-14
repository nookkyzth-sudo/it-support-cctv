import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { InstallationForm } from "@/components/ui/installation-form";

export default async function NewInstallationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#2B3674] tracking-tight">สร้างบันทึกการติดตั้ง/เปลี่ยนอุปกรณ์</h1>
        <p className="text-sm font-medium text-gray-400 mt-1">กรอกข้อมูลการติดตั้งอุปกรณ์และแนบรูปถ่าย</p>
      </div>
      <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
        <InstallationForm />
      </div>
    </div>
  );
}
