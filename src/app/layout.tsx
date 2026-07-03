import type { Metadata } from "next";
import "./globals.css";
import { cache } from "react";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { NavBar } from "@/components/ui/nav-bar";

export const metadata: Metadata = {
  title: "IT Support & CCTV System",
  description: "ระบบจัดการงาน IT Support และ CCTV",
};

const getIsAdmin = cache(async (userId: string) => {
  const admin = await createAdminClient();
  const { data: me } = await admin
    .from("users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return me?.role === "admin";
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
  if (user) {
    isAdmin = await getIsAdmin(user.id);
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
