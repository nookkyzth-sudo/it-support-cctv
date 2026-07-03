import { unstable_cache } from "next/cache";
import { createAdminClient, createClient } from "./supabase-server";
import type { Ticket, Branch, Category, User, TicketStatus, DashboardKpi } from "@/types";

export const getBranches = unstable_cache(
  async (): Promise<Branch[]> => {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("branches")
      .select("*")
      .order("branch_name", { ascending: true });
    return data || [];
  },
  ["branches"],
  { revalidate: 300, tags: ["branches"] }
);

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("category_name", { ascending: true });
    return data || [];
  },
  ["categories"],
  { revalidate: 300, tags: ["categories"] }
);

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("*, branch:branches(*)")
    .eq("user_id", user.id)
    .single();
  return data;
}

export async function getKpis(userBranchId?: number | null): Promise<DashboardKpi> {
  const supabase = await createAdminClient();

  let query = supabase.from("tickets").select("*", { count: "exact", head: true });
  if (userBranchId) query = query.eq("branch_id", userBranchId);
  const { count: pending } = await query.eq("status", "Pending");

  query = supabase.from("tickets").select("*", { count: "exact", head: true });
  if (userBranchId) query = query.eq("branch_id", userBranchId);
  const { count: inProgress } = await query.in("status", ["In_Progress", "Claim"]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  query = supabase.from("tickets").select("*", { count: "exact", head: true });
  if (userBranchId) query = query.eq("branch_id", userBranchId);
  const { count: resolvedToday } = await query
    .eq("status", "Resolved")
    .gte("resolved_date", todayStart.toISOString());

  query = supabase.from("tickets").select("*", { count: "exact", head: true });
  if (userBranchId) query = query.eq("branch_id", userBranchId);
  const { count: resolved } = await query.eq("status", "Resolved");

  return {
    pending: pending || 0,
    inProgress: inProgress || 0,
    resolved: resolved || 0,
    resolvedToday: resolvedToday || 0,
  };
}

export async function getTickets(filters?: {
  branch_id?: string;
  category_id?: string;
  status?: string;
  userBranchId?: number | null;
  date_from?: string;
  date_to?: string;
  includeLogs?: boolean;
}): Promise<Ticket[]> {
  const supabase = await createAdminClient();

  const selectQuery = filters?.includeLogs
    ? "*, branch:branches(*), category:categories(*), reporter:users!reporter_id(*), technician:users!technician_id(*), logs:ticket_logs(log_id,note,changed_at,old_status,new_status,changed_by)"
    : "*, branch:branches(*), category:categories(*), technician:users!technician_id(*)";

  const pageLimit = filters?.includeLogs ? 200 : 50;

  let query = supabase
    .from("tickets")
    .select(selectQuery)
    .order("report_date", { ascending: true })
    .limit(pageLimit);

  if (filters?.branch_id) query = query.eq("branch_id", parseInt(filters.branch_id));
  if (filters?.category_id) query = query.eq("category_id", parseInt(filters.category_id));
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.userBranchId) query = query.eq("branch_id", filters.userBranchId);
  if (filters?.date_from) query = query.gte("report_date", new Date(filters.date_from).toISOString());
  if (filters?.date_to) {
    const to = new Date(filters.date_to);
    to.setHours(23, 59, 59, 999);
    query = query.lte("report_date", to.toISOString());
  }

  const { data } = await query;
  return (data as Ticket[] | null) || [];
}

export async function getTicketById(id: number): Promise<Ticket | null> {
  const supabase = await createAdminClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*, branch:branches(*), category:categories(*), reporter:users!reporter_id(*), technician:users!technician_id(*)")
    .eq("ticket_id", id)
    .single();

  if (!ticket) return null;

  const { data: attachments } = await supabase
    .from("ticket_attachments")
    .select("*")
    .eq("ticket_id", id)
    .order("uploaded_at", { ascending: true });

  const { data: logs } = await supabase
    .from("ticket_logs")
    .select("*, changer:users!changed_by(*)")
    .eq("ticket_id", id)
    .order("changed_at", { ascending: true });

  return {
    ...(ticket as Ticket),
    attachments: attachments || [],
    logs: logs || [],
  };
}

export async function createTicket(data: {
  branch_id: number;
  category_id: number;
  reporter_id: string;
  issue_description: string;
}): Promise<Ticket> {
  const supabase = await createAdminClient();

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      branch_id: data.branch_id,
      category_id: data.category_id,
      reporter_id: data.reporter_id,
      issue_description: data.issue_description,
    })
    .select("*, branch:branches(*), category:categories(*), reporter:users!reporter_id(*)")
    .single();

  if (error) throw new Error(error.message);
  return ticket as Ticket;
}

export async function updateTicketStatus(
  ticketId: number,
  newStatus: TicketStatus,
  userId: string,
  technicianNote?: string,
  logDate?: string
): Promise<void> {
  const supabase = await createAdminClient();

  const { data: current } = await supabase
    .from("tickets")
    .select("status")
    .eq("ticket_id", ticketId)
    .single();

  const technicianNoteText = technicianNote?.trim() || null;

  const updateData: {
    status: TicketStatus;
    technician_id: string;
    technician_note?: string | null;
    resolved_date?: string;
  } = {
    status: newStatus,
    technician_id: userId,
  };

  if (technicianNote !== undefined) {
    updateData.technician_note = technicianNoteText;
  }
  if (newStatus === "Resolved") {
    updateData.resolved_date = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("tickets")
    .update(updateData)
    .eq("ticket_id", ticketId);

  if (updateError) throw new Error(updateError.message);

  const { error: logError } = await supabase.from("ticket_logs").insert({
    ticket_id: ticketId,
    old_status: current?.status || null,
    new_status: newStatus,
    note: technicianNoteText,
    changed_by: userId,
    changed_at: logDate ? new Date(logDate).toISOString() : undefined,
  });

  if (logError) throw new Error(logError.message);
}
