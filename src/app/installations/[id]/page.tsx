import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { InstallationForm } from "@/components/ui/installation-form";
import { DeleteImageButton } from "@/components/ui/delete-image-button";

export default async function EditInstallationPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = (await params).id;
  const installation = await prisma.equipment_replacements.findUnique({
    where: { id: parseInt(id) },
    include: { branch: true, attachments: true }
  });

  if (!installation) {
    redirect("/installations");
  }

  const equipmentImages = installation.attachments?.filter(a => a.type === "equipment") || [];
  const receiptImages = installation.attachments?.filter(a => a.type === "receipt") || [];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#2B3674] tracking-tight">ดู/แก้ไขบันทึกการติดตั้งอุปกรณ์</h1>
        <p className="text-sm font-medium text-gray-400 mt-1">อัปเดตข้อมูลหรือแนบรูปภาพเพิ่มเติม</p>
      </div>
      
      <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
        <InstallationForm initialData={installation} />
      </div>

      {equipmentImages.length > 0 && (
        <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)] mt-6">
          <h2 className="font-bold text-xl text-[#2B3674] mb-6">รูปภาพอุปกรณ์</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {equipmentImages.map((att) => (
              <div key={att.attachment_id} className="relative group rounded-[14px] overflow-hidden shadow-sm border border-gray-100">
                <DeleteImageButton attachmentId={att.attachment_id} />
                <a href={att.file_path} target="_blank" rel="noopener noreferrer">
                  <img
                    src={att.file_path}
                    alt="Equipment"
                    className="w-full h-40 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                  />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {receiptImages.length > 0 && (
        <div className="bg-white rounded-[20px] p-6 shadow-[0_18px_40px_rgba(112,144,176,0.12)] mt-6">
          <h2 className="font-bold text-xl text-[#2B3674] mb-6">รูปภาพใบเสร็จ</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {receiptImages.map((att) => (
              <div key={att.attachment_id} className="relative group rounded-[14px] overflow-hidden shadow-sm border border-gray-100">
                <DeleteImageButton attachmentId={att.attachment_id} />
                <a href={att.file_path} target="_blank" rel="noopener noreferrer">
                  <img
                    src={att.file_path}
                    alt="Receipt"
                    className="w-full h-40 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                  />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
