import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            IT Support & CCTV
          </h1>
          <p className="text-gray-500 mt-1">ระบบจัดการงานซ่อมบำรุง</p>
        </div>

        {params.message && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
            {params.message}
          </div>
        )}
        {params.error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {params.error}
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  );
}
