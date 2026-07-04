"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { sendLineNotify, formatTicketMessage } from "@/lib/line-notify";

export async function createTicket(
  prevState: { error?: string; success?: boolean; ticket_id?: number } | null,
  formData: FormData
) {
  try {
    const authSupabase = await createClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const supabase = await createAdminClient();

    const branchName = (formData.get("branch_name") as string)?.trim();
    const categoryName = (formData.get("category_name") as string)?.trim();
    const issue = formData.get("issue_description") as string;
    const reportDate = formData.get("report_date") as string;
    const technicianName = (formData.get("technician_name") as string)?.trim();

    if (!branchName || !categoryName || !issue) {
      return { error: "กรุณากรอกข้อมูลให้ครบ" };
    }

    let { data: branch } = await supabase
      .from("branches")
      .select("branch_id")
      .eq("branch_name", branchName)
      .maybeSingle();

    if (!branch) {
      const { data: newBranch, error: brErr } = await supabase
        .from("branches")
        .insert({ branch_name: branchName })
        .select("branch_id")
        .single();
      if (brErr) return { error: `สร้างสาขาล้มเหลว: ${brErr.message}` };
      branch = newBranch;
    }

    let { data: category } = await supabase
      .from("categories")
      .select("category_id")
      .eq("category_name", categoryName)
      .maybeSingle();

    if (!category) {
      const { data: newCategory, error: catErr } = await supabase
        .from("categories")
        .insert({ category_name: categoryName })
        .select("category_id")
        .single();
      if (catErr) return { error: `สร้างประเภทอุปกรณ์ล้มเหลว: ${catErr.message}` };
      category = newCategory;
    }

    let technician_id: string | null = null;
    if (technicianName) {
      const { data: techUser } = await supabase
        .from("users")
        .select("user_id")
        .ilike("name", technicianName)
        .in("role", ["technician", "admin"])
        .maybeSingle();
      if (techUser) {
        technician_id = techUser.user_id;
      }
    }

    const insertData: {
      branch_id: number;
      category_id: number;
      reporter_id: string;
      issue_description: string;
      technician_id?: string;
      status?: "In_Progress";
      report_date?: string;
    } = {
      branch_id: branch.branch_id,
      category_id: category.category_id,
      reporter_id: user.id,
      issue_description: issue,
    };

    if (technician_id) {
      insertData.technician_id = technician_id;
      insertData.status = "In_Progress";
    }

    if (reportDate) {
      const parts = reportDate.split("/");
      if (parts.length === 3) {
        const d = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const y = parseInt(parts[2]) - 543;
        insertData.report_date = new Date(y, m, d).toISOString();
      }
    }

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert(insertData)
      .select("*, branch:branches(*), category:categories(*), reporter:users!reporter_id(*)")
      .single();

    if (error) return { error: error.message };

    await sendLineNotify(
      formatTicketMessage(
        {
          ticket_id: ticket.ticket_id,
          branch_name: ticket.branch?.branch_name || branchName,
          category_name: ticket.category?.category_name || categoryName,
          issue_description: issue,
          reporter_name: ticket.reporter?.name,
        },
        "new"
      )
    );

    revalidatePath("/dashboard");
    return { success: true, ticket_id: ticket.ticket_id };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateTicketStatus(
  ticketId: number,
  newStatus: string,
  technicianNote?: string,
  technicianName?: string,
  logDate?: string,
  statusOnly?: boolean
) {
  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const supabase = await createAdminClient();

  const normalizedTechnicianName = technicianName?.trim() || "";
  let technicianId: string | null = null;

  if (normalizedTechnicianName) {
    const { data: existingTech } = await supabase
      .from("users")
      .select("user_id")
      .ilike("name", normalizedTechnicianName)
      .maybeSingle();

    if (existingTech?.user_id) {
      technicianId = existingTech.user_id;
    } else {
      const newTechId = crypto.randomUUID();
      const { error: techError } = await supabase.from("users").insert({
        user_id: newTechId,
        name: normalizedTechnicianName,
        role: "technician",
      });

      if (techError) throw new Error(techError.message);
      technicianId = newTechId;
    }
  }

  const { data: current } = await supabase
    .from("tickets")
    .select("status, reporter_id")
    .eq("ticket_id", ticketId)
    .single();

  if (!current) throw new Error("Ticket not found");

  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (dbUser?.role !== "admin" && current.reporter_id !== user.id) {
    throw new Error("Forbidden");
  }

  const technicianNoteText = technicianNote?.trim() || null;

  const updateData: {
    status: string;
    technician_id?: string;
    technician_note?: string | null;
    resolved_date?: string;
  } = {
    status: newStatus,
  };

  if (technicianId) {
    updateData.technician_id = technicianId;
  }

  if (!statusOnly && technicianNote !== undefined) {
    updateData.technician_note = technicianNoteText;
  }
  if (newStatus === "Resolved") {
    updateData.resolved_date = logDate
      ? new Date(logDate).toISOString()
      : new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("tickets")
    .update(updateData)
    .eq("ticket_id", ticketId);

  if (updateError) throw new Error(updateError.message);

  await supabase.from("ticket_logs").insert({
    ticket_id: ticketId,
    old_status: current?.status || null,
    new_status: newStatus,
    note: statusOnly ? null : technicianNoteText,
    changed_by: user.id,
    changed_at: logDate ? new Date(logDate).toISOString() : undefined,
  });

  if (newStatus === "Resolved") {
    const { data: ticket } = await supabase
      .from("tickets")
      .select("*, branch:branches(*), category:categories(*)")
      .eq("ticket_id", ticketId)
      .single();

    if (ticket) {
      await sendLineNotify(
        formatTicketMessage(
          {
            ticket_id: ticket.ticket_id,
            branch_name: ticket.branch?.branch_name || "",
            category_name: ticket.category?.category_name || "",
            issue_description: ticket.issue_description,
          },
          "resolved"
        )
      );
    }
  }

  revalidatePath("/dashboard");
  revalidatePath(`/tickets/${ticketId}`);
}
