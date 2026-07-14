import type { Metadata } from "next";
import "./globals.css";
import { cache } from "react";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { SideBar } from "@/components/ui/side-bar";

export const metadata: Metadata = {
  title: "IT Support & CCTV System",
  description: "ระบบจัดการงาน IT Support และ CCTV",
};

const getUserRole = cache(async (userId: string) => {
  const admin = await createAdminClient();
  const { data: me } = await admin
    .from("users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return me?.role || "staff";
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let userRole = "staff";
  if (user) {
    userRole = await getUserRole(user.id);
    isAdmin = userRole === "admin";
  }

  return (
    <html lang="th">
      <body className="min-h-screen bg-[#F4F7FE] text-gray-800">
        <div className="flex h-screen overflow-hidden">
          {user && <SideBar isAdmin={isAdmin} userEmail={user.email} userRole={userRole} />}
          
          <div className="flex-1 flex flex-col h-screen overflow-y-auto">
            <main className={user ? "flex-1 p-6 md:p-8" : "flex-1"}>
              {children}
            </main>
            {user && (
              <footer className="py-4 text-center text-sm text-gray-400 mt-auto">
                เว็บไซต์นี้พัฒนาโดย Nook-Thanakorn
              </footer>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
