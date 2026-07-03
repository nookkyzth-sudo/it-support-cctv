"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import type { TicketStatus, UserRole } from "@/types";

async function ensureAdmin() {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const admin = await createAdminClient();
  const { data: me } = await admin
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!me || me.role !== "admin") {
    throw new Error("Forbidden");
  }

  return admin;
}

export async function createBranchAction(formData: FormData) {
  const supabase = await ensureAdmin();
  const branch_name = (formData.get("branch_name") as string)?.trim();
  const zone = (formData.get("zone") as string)?.trim() || null;

  if (!branch_name) throw new Error("กรุณากรอกชื่อสาขา");

  const { error } = await supabase.from("branches").insert({ branch_name, zone });
  if (error) throw new Error(error.message);

  revalidatePath("/admin", "page");
}

export async function updateBranchAction(formData: FormData) {
  const supabase = await ensureAdmin();
  const branch_id = Number(formData.get("branch_id"));
  const branch_name = (formData.get("branch_name") as string)?.trim();
  const zone = (formData.get("zone") as string)?.trim() || null;

  if (!branch_id || !branch_name) throw new Error("ข้อมูลไม่ครบ");

  const { error } = await supabase
    .from("branches")
    .update({ branch_name, zone })
    .eq("branch_id", branch_id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin", "page");
}

export async function deleteBranchAction(formData: FormData) {
  const supabase = await ensureAdmin();
  const branch_id = Number(formData.get("branch_id"));

  if (!branch_id) throw new Error("ข้อมูลไม่ครบ");

  const { count: ticketCount } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("branch_id", branch_id);

  const { count: userCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("branch_id", branch_id);

  if ((ticketCount || 0) > 0 || (userCount || 0) > 0) {
    return;
  }

  const { error } = await supabase
    .from("branches")
    .delete()
    .eq("branch_id", branch_id);

  if (error) {
    return;
  }
  revalidatePath("/admin", "page");
}

export async function createCategoryAction(formData: FormData) {
  const supabase = await ensureAdmin();
  const category_name = (formData.get("category_name") as string)?.trim();

  if (!category_name) throw new Error("กรุณากรอกประเภท");

  const { error } = await supabase.from("categories").insert({ category_name });
  if (error) throw new Error(error.message);

  revalidatePath("/admin", "page");
}

export async function updateCategoryAction(formData: FormData) {
  const supabase = await ensureAdmin();
  const category_id = Number(formData.get("category_id"));
  const category_name = (formData.get("category_name") as string)?.trim();

  if (!category_id || !category_name) throw new Error("ข้อมูลไม่ครบ");

  const { error } = await supabase
    .from("categories")
    .update({ category_name })
    .eq("category_id", category_id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin", "page");
}

export async function deleteCategoryAction(formData: FormData) {
  const supabase = await ensureAdmin();
  const category_id = Number(formData.get("category_id"));

  if (!category_id) throw new Error("ข้อมูลไม่ครบ");

  const { count: ticketCount } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("category_id", category_id);

  if ((ticketCount || 0) > 0) {
    return;
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("category_id", category_id);

  if (error) {
    return;
  }
  revalidatePath("/admin", "page");
}

export async function updateUserAction(formData: FormData) {
  const supabase = await ensureAdmin();
  const user_id = formData.get("user_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const role = formData.get("role") as UserRole;
  const branchRaw = formData.get("branch_id") as string;
  const branch_id = branchRaw ? Number(branchRaw) : null;

  if (!user_id || !name || !role) throw new Error("ข้อมูลไม่ครบ");

  const { error } = await supabase
    .from("users")
    .update({ name, email, role, branch_id })
    .eq("user_id", user_id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin", "page");
}

export async function deleteUserAction(formData: FormData) {
  const supabase = await ensureAdmin();
  const user_id = formData.get("user_id") as string;

  if (!user_id) throw new Error("ข้อมูลไม่ครบ");

  const { count: reporterCount } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("reporter_id", user_id);

  const { count: techCount } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("technician_id", user_id);

  if ((reporterCount || 0) > 0 || (techCount || 0) > 0) {
    return;
  }

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("user_id", user_id);

  if (error) {
    return;
  }

  const { error: authError } = await supabase.auth.admin.deleteUser(user_id);
  if (authError) {
    return;
  }

  revalidatePath("/admin", "page");
}

export async function updateTicketAdminAction(formData: FormData) {
  const supabase = await ensureAdmin();
  const ticket_id = Number(formData.get("ticket_id"));
  const branch_id = Number(formData.get("branch_id"));
  const category_id = Number(formData.get("category_id"));
  const status = formData.get("status") as TicketStatus;
  const issue_description = (formData.get("issue_description") as string)?.trim();
  const technician_note = (formData.get("technician_note") as string)?.trim() || null;
  const report_date = formData.get("report_date") as string;
  const resolved_date = formData.get("resolved_date") as string;

  if (!ticket_id || !branch_id || !category_id || !status || !issue_description) {
    throw new Error("ข้อมูลไม่ครบ");
  }

  const updateData: {
    branch_id: number;
    category_id: number;
    status: TicketStatus;
    issue_description: string;
    technician_note: string | null;
    report_date?: string;
    resolved_date?: string | null;
  } = {
    branch_id,
    category_id,
    status,
    issue_description,
    technician_note,
  };

  if (report_date) {
    updateData.report_date = new Date(report_date).toISOString();
  }

  if (status === "Resolved" && resolved_date) {
    updateData.resolved_date = new Date(resolved_date).toISOString();
  } else if (status === "Resolved") {
    updateData.resolved_date = new Date().toISOString();
  } else {
    updateData.resolved_date = null;
  }

  const { error } = await supabase
    .from("tickets")
    .update(updateData)
    .eq("ticket_id", ticket_id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin", "page");
  revalidatePath("/dashboard", "page");
  revalidatePath("/repairs", "page");
}

export async function deleteTicketAdminAction(formData: FormData) {
  const supabase = await ensureAdmin();
  const ticket_id = Number(formData.get("ticket_id"));

  if (!ticket_id) throw new Error("ข้อมูลไม่ครบ");

  const { error: logsError } = await supabase
    .from("ticket_logs")
    .delete()
    .eq("ticket_id", ticket_id);
  if (logsError) throw new Error(logsError.message);

  const { error: attError } = await supabase
    .from("ticket_attachments")
    .delete()
    .eq("ticket_id", ticket_id);
  if (attError) throw new Error(attError.message);

  const { error } = await supabase
    .from("tickets")
    .delete()
    .eq("ticket_id", ticket_id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin", "page");
  revalidatePath("/dashboard", "page");
  revalidatePath("/repairs", "page");
}

