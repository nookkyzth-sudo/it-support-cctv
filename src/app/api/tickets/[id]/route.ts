import { NextRequest } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const { id } = await params;
  const ticketId = parseInt(id);

  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  let ticketQuery = supabase
    .from("tickets")
    .select("*, branch:branches(*), category:categories(*), reporter:users!reporter_id(*), technician:users!technician_id(*)")
    .eq("ticket_id", ticketId);

  if (dbUser?.role !== "admin") {
    ticketQuery = ticketQuery.eq("reporter_id", user.id);
  }

  const { data: ticket, error } = await ticketQuery.single();

  if (error || !ticket) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { data: attachments } = await supabase
    .from("ticket_attachments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("uploaded_at", { ascending: true });

  const { data: logs } = await supabase
    .from("ticket_logs")
    .select("*, changer:users!changed_by(*)")
    .eq("ticket_id", ticketId)
    .order("changed_at", { ascending: true });

  return Response.json({ ...ticket, attachments: attachments || [], logs: logs || [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const { id } = await params;
  const body = (await request.json()) as {
    status?: string;
    technician_note?: string;
    technician_id?: string;
    log_date?: string;
  };
  const ticketId = parseInt(id);

  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  let accessQuery = supabase
    .from("tickets")
    .select("ticket_id")
    .eq("ticket_id", ticketId);

  if (dbUser?.role !== "admin") {
    accessQuery = accessQuery.eq("reporter_id", user.id);
  }

  const { data: canAccess } = await accessQuery.maybeSingle();
  if (!canAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const technicianNote = body.technician_note?.trim() || null;

  const { data: current } = await supabase
    .from("tickets")
    .select("status")
    .eq("ticket_id", ticketId)
    .single();

  const updateData: Record<string, string | number | null | undefined> = {};
  if (body.status) updateData.status = body.status;
  if (body.technician_note !== undefined) updateData.technician_note = technicianNote;
  if (body.technician_id) updateData.technician_id = body.technician_id;
  if (body.status === "Resolved") {
    updateData.resolved_date = body.log_date
      ? new Date(body.log_date).toISOString()
      : new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("tickets")
    .update(updateData)
    .eq("ticket_id", ticketId);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("ticket_logs").insert({
    ticket_id: ticketId,
    old_status: current?.status || null,
    new_status: body.status || current?.status,
    note: technicianNote,
    changed_by: user.id,
    changed_at: body.log_date ? new Date(body.log_date).toISOString() : undefined,
  });

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*, branch:branches(*), category:categories(*), reporter:users!reporter_id(*), technician:users!technician_id(*)")
    .eq("ticket_id", ticketId)
    .single();

  const { data: attachments } = await supabase
    .from("ticket_attachments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("uploaded_at", { ascending: true });

  const { data: logs } = await supabase
    .from("ticket_logs")
    .select("*, changer:users!changed_by(*)")
    .eq("ticket_id", ticketId)
    .order("changed_at", { ascending: true });

  return Response.json({ ...ticket, attachments: attachments || [], logs: logs || [] });
}
