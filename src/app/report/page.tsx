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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">แจ้งซ่อม</h1>
      <ReportForm />
    </div>
  );
}
