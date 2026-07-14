import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/supabase-db";
import { ProfileForm } from "@/components/ui/profile-form";
import { UserCircle } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await getCurrentUser();

  return (
    <div className="space-y-8 pb-10 max-w-4xl">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#2B3674] tracking-tight">โปรไฟล์ของฉัน</h1>
        <p className="text-sm font-medium text-gray-400 mt-1">
          จัดการข้อมูลส่วนตัวและรหัสผ่าน
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCircle size={20} />
            </div>
            <h2 className="text-xl font-bold text-[#2B3674]">ข้อมูลทั่วไป</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">ชื่อ-นามสกุล</p>
              <p className="text-sm font-bold text-[#2B3674]">{dbUser?.name || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">อีเมล</p>
              <p className="text-sm font-bold text-[#2B3674]">{user.email || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">ตำแหน่ง (Role)</p>
              <p className="text-sm font-bold text-[#2B3674] uppercase">{dbUser?.role || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">สาขา</p>
              <p className="text-sm font-bold text-[#2B3674]">{dbUser?.branch?.branch_name || "ไม่ระบุ"}</p>
            </div>
          </div>
        </div>

        {/* Password Form */}
        <ProfileForm />
      </div>
    </div>
  );
}
