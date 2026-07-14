import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const branch_id = searchParams.get("branch_id");

  const dbUser = await prisma.users.findUnique({
    where: { user_id: user.id }
  });

  let whereClause: any = {};
  if (dbUser?.role === "staff" && dbUser.branch_id) {
    whereClause.branch_id = dbUser.branch_id;
  } else if (branch_id) {
    whereClause.branch_id = parseInt(branch_id);
  }

  const purchases = await prisma.purchase_requests.findMany({
    where: whereClause,
    include: {
      branch: true,
      requester: true,
    },
    orderBy: { request_date: 'desc' }
  });

  return Response.json(purchases);
}

export async function POST(request: NextRequest) {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const purchase = await prisma.purchase_requests.create({
    data: {
      branch_id: branch_id,
      requester_id: user.id,
      target_branch: "-",
      items_details: body.items_details,
      total_price: 0,
      reason: null,
      payment_condition: "-",
      employee_name: "-",
      area_manager: "-",
      last_purchased: "-",
      distance: "-",
      request_date: body.request_date ? new Date(body.request_date) : undefined,
      status: "Pending"
    },
    include: {
      branch: true,
      requester: true
    }
  });

  return Response.json(purchase, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.users.findUnique({
    where: { user_id: user.id }
  });

  if (dbUser?.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    // ลบไฟล์แนบก่อนเพื่อป้องกัน Foreign Key Constraint Error
    await prisma.purchase_attachments.deleteMany({
      where: { purchase_id: parseInt(id) }
    });

    await prisma.purchase_requests.delete({
      where: { id: parseInt(id) }
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting purchase request:", error);
    return Response.json({ error: error.message || "Failed to delete" }, { status: 500 });
  }
}

