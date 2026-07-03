import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { AdminPanel } from "@/components/ui/admin-panel";
import type { Branch, Category, Ticket, User } from "@/types";

export default async function AdminPage() {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) redirect("/login");

  const supabase = await createAdminClient();

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!me || me.role !== "admin") {
    redirect("/dashboard");
  }

  const [branchesRes, categoriesRes, usersRes, ticketsRes] = await Promise.all([
    supabase.from("branches").select("*").order("branch_name", { ascending: true }),
    supabase.from("categories").select("*").order("category_name", { ascending: true }),
    supabase.from("users").select("*").order("name", { ascending: true }),
    supabase
      .from("tickets")
      .select("*, branch:branches(*), category:categories(*), technician:users!technician_id(*)")
      .order("report_date", { ascending: false })
      .limit(100),
  ]);

  const branches = (branchesRes.data || []) as Branch[];
  const categories = (categoriesRes.data || []) as Category[];
  const users = (usersRes.data || []) as User[];
  const tickets = (ticketsRes.data || []) as Ticket[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">จัดการระบบ (Admin)</h1>
        <p className="text-sm text-gray-500 mt-1">แก้ไขข้อมูลหลักได้จากหน้านี้โดยไม่ต้องเข้า Database</p>
      </div>
      <AdminPanel
        branches={branches}
        categories={categories}
        users={users}
        tickets={tickets}
      />
    </div>
  );
}
