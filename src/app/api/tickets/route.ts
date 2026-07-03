import { NextRequest } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const branch_id = searchParams.get("branch_id");
  const category_id = searchParams.get("category_id");
  const status = searchParams.get("status");

  const supabase = await createAdminClient();

  let query = supabase
    .from("tickets")
    .select("*, branch:branches(*), category:categories(*), reporter:users!reporter_id(*), technician:users!technician_id(*)")
    .order("report_date", { ascending: false });

  if (branch_id) query = query.eq("branch_id", parseInt(branch_id));
  if (category_id) query = query.eq("category_id", parseInt(category_id));
  if (status) query = query.eq("status", status);

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (dbUser?.role === "staff" && dbUser?.branch_id) {
    query = query.eq("branch_id", dbUser.branch_id);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      branch_id: body.branch_id,
      category_id: body.category_id,
      reporter_id: user.id,
      issue_description: body.issue_description,
    })
    .select("*, branch:branches(*), category:categories(*), reporter:users!reporter_id(*)")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data, { status: 201 });
}
