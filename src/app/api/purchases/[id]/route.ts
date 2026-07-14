import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const id = (await params).id;

  const purchase = await prisma.purchase_requests.findUnique({
    where: { id: parseInt(id) },
    include: {
      branch: true,
      requester: true,
      attachments: true
    }
  });

  if (!purchase) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(purchase);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = (await params).id;
  const body = await request.json();

  let branch_id: number;
  if (body.branch_name) {
    const branchName = body.branch_name.trim();
    let branch = await prisma.branches.findUnique({
      where: { branch_name: branchName }
    });
    if (!branch) {
      branch = await prisma.branches.create({
        data: { branch_name: branchName }
      });
    }
    branch_id = branch.branch_id;
  } else {
    branch_id = parseInt(body.branch_id);
  }

  const purchase = await prisma.purchase_requests.update({
    where: { id: parseInt(id) },
    data: {
      branch_id: branch_id,
      items_details: body.items_details,
      request_date: body.request_date ? new Date(body.request_date) : undefined,
    }
  });

  return Response.json(purchase);
}
