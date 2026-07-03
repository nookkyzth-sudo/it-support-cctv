"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase-server";

export async function login(
  prevState: { error: string } | null,
  formData: FormData
) {
  const identifier = (formData.get("identifier") as string)?.trim();
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }

  let email = identifier;

  // If not an email, look up email from users table by name
  if (!identifier.includes("@")) {
    const supabaseAdmin = await createAdminClient();
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("email")
      .ilike("name", identifier)
      .maybeSingle();

    if (!userRow?.email) {
      return { error: "ไม่พบผู้ใช้งาน กรุณาตรวจสอบชื่อผู้ใช้หรืออีเมล" };
    }
    email = userRow.email;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง" };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  prevState: { error: string } | null,
  formData: FormData
) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }
  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  const supabaseAdmin = await createAdminClient();

  // Check if name already taken
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("user_id")
    .ilike("name", name)
    .maybeSingle();

  if (existing) {
    return { error: "ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว กรุณาเลือกชื่ออื่น" };
  }

  // Create auth user with auto email confirmation
  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
    }
    return { error: authError.message };
  }

  if (data.user) {
    await supabaseAdmin.from("users").upsert({
      user_id: data.user.id,
      name,
      email,
      role: "staff",
    });
  }

  // Sign in immediately after signup
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
