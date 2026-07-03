import type { Metadata } from "next";
import "./globals.css";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { NavBar } from "@/components/ui/nav-bar";

export const metadata: Metadata = {
  title: "IT Support & CCTV System",
  description: "ระบบจัดการงาน IT Support และ CCTV",
};

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
  if (user) {
    const admin = await createAdminClient();
    const { data: me } = await admin
      .from("users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = me?.role === "admin";
  }

  return (
    <html lang="th">
      <body className="min-h-screen bg-gray-50">
        {user && <NavBar isAdmin={isAdmin} />}
        <main className={user ? "max-w-7xl mx-auto px-4 py-6" : ""}>
          {children}
        </main>
      </body>
    </html>
  );
}
